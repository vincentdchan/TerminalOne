use crate::Result;
use log::{error, info, warn};
use portable_pty::{native_pty_system, Child, CommandBuilder, ExitStatus, MasterPty, PtySize};
use std::env;
use std::sync::{Arc, Mutex};

pub(crate) trait TerminalDelegateEventHandler {
    fn handle_data(&self, terminal: &TerminalDelegate, data: &[u8]) -> Result<()>;
    fn handle_exit(&self, id: String, exit_statue: ExitStatus) -> Result<()>;
}

#[derive(Clone)]
pub(crate) struct TerminalDelegate {
    inner: Arc<Mutex<TerminalDelegateInner>>,
    _event_handler: Arc<Mutex<Box<dyn TerminalDelegateEventHandler + Send>>>,
}

fn make_precommit_dir() -> Result<String> {
    let mut current_dir = env::current_dir()?;

    current_dir.pop();
    current_dir.push("shell_integration");
    current_dir.push("t1.sh");

    Ok(current_dir.to_str().unwrap().to_string())
}

impl TerminalDelegate {
    pub(crate) fn new(
        id: String,
        event_handler: Box<dyn TerminalDelegateEventHandler + Send>,
    ) -> Result<TerminalDelegate> {
        let (inner, mut child) = TerminalDelegateInner::new(id.clone())?;

        let event_handler = Arc::new(Mutex::new(event_handler));
        let delegate = TerminalDelegate {
            inner: Arc::new(Mutex::new(inner)),
            _event_handler: event_handler.clone(),
        };

        let delegate_clone = delegate.clone();
        let mut reader = delegate_clone.try_clone_reader()?;
        let reader_id = id.clone();
        let reader_event_handler = event_handler.clone();
        std::thread::spawn(move || {
            info!("begin reader thread: {}", reader_id);
            loop {
                // Consume the output from the child
                let mut buffer: Vec<u8> = vec![0; 4096];
                // let mut s = String::new();
                // reader.read_to_string(&mut s).unwrap();

                let test_size = reader.read(&mut buffer);

                if test_size.is_err() {
                    let err = test_size.unwrap_err();
                    error!("reader thread error: {}, id: {}", err, reader_id);
                    break;
                }

                let size = test_size.unwrap();

                if size == 0 {
                    info!("reader thread EOF, id: {}", reader_id);
                    break;
                }

                {
                    let event_handler_lock = reader_event_handler.lock().unwrap();
                    event_handler_lock
                        .handle_data(&delegate_clone, buffer[0..size].as_ref())
                        .unwrap();
                }
            }
            info!("end reader thread: {}", reader_id);
        });

        let monitor_id = id.clone();
        let monitor_event_handler = event_handler.clone();
        std::thread::spawn(move || {
            let test_wait = child.wait();
            if test_wait.is_err() {
                error!("wait error: {}, id: {}", test_wait.unwrap_err(), id);
                return;
            }
            let wait_result = test_wait.unwrap();
            info!("wait result: {}, id: {}", wait_result, id);
            {
                let event_handler_lock = monitor_event_handler.lock().unwrap();
                event_handler_lock
                    .handle_exit(monitor_id, wait_result)
                    .unwrap();
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

    fn try_clone_reader(&self) -> Result<Box<dyn std::io::Read + Send>> {
        let inner = self.inner.lock().unwrap();
        let reader = inner
            .master
            .as_ref()
            .expect("terminal is closed")
            .try_clone_reader()?;
        Ok(reader)
    }

    pub(crate) fn id(&self) -> String {
        self.inner.lock().unwrap().id.clone()
    }

    pub(crate) fn resize(&self, rows: u16, cols: u16) -> Result<()> {
        let mut inner = self.inner.lock().unwrap();
        inner.resize(rows, cols)
    }

    pub(crate) fn close(&self) {
        let mut inner = self.inner.lock().unwrap();
        inner.close();
    }
}

impl std::io::Write for TerminalDelegate {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let mut inner = self.inner.lock().unwrap();
        let size = if let Some(writer) = inner.writer.as_mut() {
            writer.write(buf)?
        } else {
            warn!("writing {} bytes to closed terminal", buf.len());
            0
        };
        Ok(size)
    }

    fn flush(&mut self) -> std::io::Result<()> {
        let mut inner = self.inner.lock().unwrap();
        if let Some(writer) = inner.writer.as_mut() {
            writer.flush()?;
        } else {
            warn!("flushing bytes to closed terminal");
        }
        Ok(())
    }
}

struct TerminalDelegateInner {
    id: String,
    master: Option<Box<dyn MasterPty + Send>>,
    writer: Option<Box<dyn std::io::Write + Send>>,
}

impl TerminalDelegateInner {
    fn new(id: String) -> Result<(TerminalDelegateInner, Box<dyn Child + Send + Sync>)> {
        // Use the native pty implementation for the system
        let pty_system = native_pty_system();

        // Create a new pty
        let pair = pty_system.openpty(PtySize {
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
        // add params to cmd
        let mut cmd = CommandBuilder::new("zsh");
        cmd.arg("-il");
        cmd.env("TERM_PROGRAM", "GPTerminal.app");
        let child = pair.slave.spawn_command(cmd)?;

        drop(pair.slave);

        let mut writer = pair.master.take_writer()?;

        let precommit_str = {
            let mut result = "source ".to_string();
            let precommit_dir = make_precommit_dir()?;
            result += precommit_dir.as_str();
            result
        };
        writer.write(precommit_str.as_bytes())?;
        writer.write("\r".as_bytes())?;

        let inner = TerminalDelegateInner {
            id: id.clone(),
            master: Some(pair.master),
            writer: Some(writer),
        };

        Ok((inner, child))
    }

    fn resize(&mut self, rows: u16, cols: u16) -> Result<()> {
        if let Some(master) = self.master.as_mut() {
            master.resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })?;
        }
        Ok(())
    }

    fn close(&mut self) {
        self.writer = None;
        self.master = None;
    }
}
