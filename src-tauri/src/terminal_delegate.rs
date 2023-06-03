
use std::sync::{Arc, Mutex};
use bson::oid::ObjectId;
use portable_pty::{MasterPty, CommandBuilder, PtySize, native_pty_system};
use log::info;
use crate::Result;

#[derive(Clone)]
pub(crate) struct TerminalDelegate {
  inner: Arc<Mutex<TerminalDelegateInner>>,
  buffer_callback: Arc<Mutex<Box<dyn Fn(&TerminalDelegate, &[u8]) -> Result<()> + Send>>>,
}

impl TerminalDelegate {

  pub(crate) fn new(buffer_callback: Box<dyn Fn(&TerminalDelegate, &[u8]) -> Result<()> + Send>) -> Result<TerminalDelegate> {
    let inner = TerminalDelegateInner::new()?;
    let delegate = TerminalDelegate {
      inner: Arc::new(Mutex::new(inner)),
      buffer_callback: Arc::new(Mutex::new(buffer_callback)),
    };

    let delegate_clone = delegate.clone();
    let mut reader = delegate_clone.try_clone_reader()?;
    std::thread::spawn(move || {
      info!("begin reader thread");
      loop {
        // Consume the output from the child
        let mut buffer: Vec<u8> = vec![0; 4096];
        // let mut s = String::new();
        // reader.read_to_string(&mut s).unwrap();

        let size = reader.read(&mut buffer).unwrap();
        delegate_clone.emit_callback(buffer[0..size].as_ref()).unwrap();
      }
    });

    if cfg!(target_os = "macos") {
      // macOS quirk: the child and reader must be started and
      // allowed a brief grace period to run before we allow
      // the writer to drop. Otherwise, the data we send to
      // the kernel to trigger EOF is interleaved with the
      // data read by the reader! WTF!?
      // This appears to be a race condition for very short
      // lived processes on macOS.
      // I'd love to find a more deterministic solution to
      // this than sleeping.
      std::thread::sleep(std::time::Duration::from_millis(20));
    }

    Ok(delegate)
  }

  fn emit_callback(&self, buffer: &[u8]) -> Result<()> {
    let callback = self.buffer_callback.lock().unwrap();
    callback(self, buffer)
  }

  fn try_clone_reader(&self) -> Result<Box<dyn std::io::Read + Send>> {
    let inner = self.inner.lock().unwrap();
    let reader = inner.master.try_clone_reader()?;
    Ok(reader)
  }

  pub(crate) fn id(&self) -> ObjectId {
    self.inner.lock().unwrap().id.clone()
  }

}

impl std::io::Write for TerminalDelegate {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
      let mut inner = self.inner.lock().unwrap();
      inner.writer.write(buf)
    }

    fn flush(&mut self) -> std::io::Result<()> {
      let mut inner = self.inner.lock().unwrap();
      inner.writer.flush()
    }
}

struct TerminalDelegateInner {
  id: ObjectId,
  master: Box<dyn MasterPty + Send>,
  _child: Box<dyn portable_pty::Child + Send + Sync>,
  writer: Box<dyn std::io::Write + Send>,
}

impl TerminalDelegateInner {

  fn new() -> Result<TerminalDelegateInner> {
    let oid = ObjectId::new();

    // Use the native pty implementation for the system
    let pty_system = native_pty_system();

    // Create a new pty
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            // Not all systems support pixel_width, pixel_height,
            // but it is good practice to set it to something
            // that matches the size of the selected font.  That
            // is more complex than can be shown here in this
            // brief example though!
            pixel_width: 0,
            pixel_height: 0,
        })?;

    // Spawn a shell into the pty
    let cmd = CommandBuilder::new("zsh");
    let child = pair.slave.spawn_command(cmd)?;

    drop(pair.slave);

    let writer = pair.master.take_writer()?;

    let inner = TerminalDelegateInner {
      id: oid,
      master: pair.master,
      _child: child,
      writer,
    };
    Ok(inner)
  }
    
}
