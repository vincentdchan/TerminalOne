use crate::messages::TermOptions;
use crate::process_statistics::{fetch_process_statistics_by_pid, StatResult};
use crate::Result;
use log::{debug, error, info, warn};
use notify_debouncer_mini::{new_debouncer, notify::*, DebounceEventResult, Debouncer};
use portable_pty::{native_pty_system, Child, CommandBuilder, ExitStatus, MasterPty, PtySize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::Duration;

const ZDOTDIR: &str = "ZDOTDIR";
const USER_ZDOTDIR: &str = "USER_ZDOTDIR";

pub(crate) trait TerminalDelegateEventHandler {
    fn handle_data(&self, terminal: &TerminalDelegate, data: &[u8]) -> Result<()>;
    fn handle_exit(&self, id: String, exit_statue: ExitStatus) -> Result<()>;
    fn handle_fs_changed(&self, id: String, path: Vec<String>) -> Result<()>;
}

#[derive(Clone)]
pub(crate) struct TerminalDelegate {
    inner: Arc<Mutex<TerminalDelegateInner>>,
    _event_handler: Arc<Mutex<Box<dyn TerminalDelegateEventHandler + Send>>>,
}

impl TerminalDelegate {
    pub(crate) fn new(
        id: String,
        path: Option<String>,
        shell_path: PathBuf,
        envs: BTreeMap<String, Option<String>>,
        event_handler: Box<dyn TerminalDelegateEventHandler + Send>,
    ) -> Result<TerminalDelegate> {
        let (inner, mut child) = TerminalDelegateInner::new(
            id.clone(),
            path,
            shell_path,
            envs,
        )?;

        let event_handler = Arc::new(Mutex::new(event_handler));
        let delegate = TerminalDelegate {
            inner: Arc::new(Mutex::new(inner)),
            _event_handler: event_handler.clone(),
        };

        // <-- thread to read from the child process and send to the terminal
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

    pub(crate) fn set_options(&self, options: TermOptions) -> Result<()> {
        let event_handler = self._event_handler.clone();
        let mut inner = self.inner.lock().unwrap();
        inner.set_options(options, event_handler)
    }

    pub(crate) fn fetch_statistics(&self) -> StatResult {
        let process_id = {
            let inner = self.inner.lock().unwrap();
            inner.process_id
        };

        process_id
            .map(|pid| fetch_process_statistics_by_pid(pid))
            .unwrap_or_default()
    }

    #[allow(unused)]
    pub(crate) fn is_closed(&self) -> bool {
        let inner = self.inner.lock().unwrap();
        inner.is_closed
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
    #[allow(dead_code)]
    shell_path: PathBuf,
    process_id: Option<u32>,
    is_closed: bool,
    master: Option<Box<dyn MasterPty + Send>>,
    writer: Option<Box<dyn std::io::Write + Send>>,
    options: Option<TermOptions>,
    fs_watcher: Option<Debouncer<FsEventWatcher>>,
}

fn get_user_zdot_dir() -> String {
    let test_env = std::env::var("ZDOTDIR");
    if test_env.is_ok() {
        return test_env.unwrap();
    }

    let home_dir_test = dirs::home_dir();
    if home_dir_test.is_some() {
        return home_dir_test.unwrap().to_str().unwrap().to_string();
    }

    return "~".to_string();
}

impl TerminalDelegateInner {
    fn new(
        id: String,
        path: Option<String>,
        shell_path: PathBuf,
        envs: BTreeMap<String, Option<String>>,
    ) -> Result<(TerminalDelegateInner, Box<dyn Child + Send + Sync>)> {
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

        let dot_dir_str = shell_path.to_str().unwrap();
        let user_dot_dir_str = get_user_zdot_dir();

        // Spawn a shell into the pty
        // add params to cmd
        let mut cmd = CommandBuilder::new("/bin/zsh");
        cmd.arg("--login");
        let version = env!("CARGO_PKG_VERSION");
        cmd.env("TERM_PROGRAM", "Terminal_One.app");
        cmd.env("TERM_PROGRAM_VERSION", version);
        cmd.env("TERM", "xterm-256color");
        cmd.env("LANG", "en_US.UTF-8");
        cmd.env(ZDOTDIR, dot_dir_str);
        cmd.env(USER_ZDOTDIR, user_dot_dir_str);

        for (key, value) in envs {
            if let Some(value) = value {
                cmd.env(key, value);
            } else {
                cmd.env_remove(key);
            }
        }

        if let Some(path) = path.as_ref() {
            cmd.cwd(path);
        } else {
            let home_dir = dirs::home_dir().unwrap().to_str().unwrap().to_string();
            cmd.cwd(&home_dir);
        }

        let child = pair.slave.spawn_command(cmd)?;
        let process_id = child.process_id();

        drop(pair.slave);

        let writer = pair.master.take_writer()?;

        let inner = TerminalDelegateInner {
            id: id.clone(),
            shell_path,
            process_id,
            is_closed: false,
            master: Some(pair.master),
            writer: Some(writer),
            options: None,
            fs_watcher: None::<Debouncer<FsEventWatcher>>,
        };

        Ok((inner, child))
    }

    fn set_options(
        &mut self,
        options: TermOptions,
        event_handler: Arc<Mutex<Box<dyn TerminalDelegateEventHandler + Send>>>,
    ) -> Result<()> {
        let opt = options.clone();

        if let Some(exist) = &self.options {
            if exist == &opt {
                return Ok(());
            }
        }

        self.options = Some(options);

        if !opt.watch_dirs {
            self.fs_watcher = None;
            return Ok(());
        }

        let mut debouncer = {
            let id_clone: String = self.id.clone();
            new_debouncer(
                Duration::from_secs(1),
                None,
                move |res: DebounceEventResult| {
                    let id: String = id_clone.clone();
                    match res {
                        Ok(event) => {
                            debug!("event: {:?}", event);

                            let mut paths = Vec::new();

                            for event in event {
                                paths.push(event.path.to_string_lossy().to_string());
                            }

                            let handler = event_handler.lock().unwrap();
                            handler.handle_fs_changed(id, paths).unwrap();
                        }
                        Err(e) => error!("watch error: {:?}", e),
                    }
                },
            )?
        };

        debouncer
            .watcher()
            .watch(Path::new(&opt.path), RecursiveMode::Recursive)?;

        self.fs_watcher = Some(debouncer);

        debug!("watch: {:?}", &opt.path);

        Ok(())
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
