use crate::messages::ThemeResponse;
use crate::terminal_delegate::{TerminalDelegate, TerminalDelegateEventHandler};
use crate::theme_context::{ThemeContext, ThemeItem};
use crate::{Error, Result};
use polodb_core::Database;
use log::debug;
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, Mutex};

pub(crate) struct AppState {
    inner: Arc<Mutex<AppStateInner>>,
}

impl AppState {
    pub(crate) fn new() -> AppState {
        AppState {
            inner: Arc::new(Mutex::new(AppStateInner::new())),
        }
    }

    pub(crate) fn new_terminal(
        &self,
        id: String,
        shell_path: &Path,
        event_handler: Box<dyn TerminalDelegateEventHandler + Send>,
    ) -> Result<TerminalDelegate> {
        let delegate: TerminalDelegate = TerminalDelegate::new(
            id,
            shell_path,
            event_handler,
        )?;
        {
            let mut inner = self.inner.lock().unwrap();
            inner.insert_terminal(delegate.clone());
        }
        Ok(delegate)
    }

    pub(crate) fn get_terminal_by_id(&self, id: &str) -> TerminalDelegate {
        let inner = self.inner.lock().unwrap();
        inner.terminals.get(id).unwrap().clone()
    }

    pub(crate) fn remove_terminal_by_id(&self, id: &str) {
        let mut inner = self.inner.lock().unwrap();
        {
            let terminal = inner.terminals.get(id).unwrap().clone();
            terminal.close();
        }
        inner.terminals.remove(id);
    }

    pub(crate) fn load_themes(&self, dir: &Path) -> Result<()> {
        let mut inner = self.inner.lock().unwrap();
        inner.load_themes(dir)
    }

    pub(crate) fn get_a_theme(&self) -> Result<ThemeResponse> {
        let inner = self.inner.lock().unwrap();
        inner.get_a_theme()
    }

    pub(crate) fn init_db(&self, data_path: &Path) -> Result<()> {
        let mut inner = self.inner.lock().unwrap();
        inner.init_db(data_path)
    }
}

struct AppStateInner {
    terminals: HashMap<String, TerminalDelegate>,
    theme_context: Option<ThemeContext>,
    database: Option<Database>,
}

impl AppStateInner {
    fn new() -> AppStateInner {
        AppStateInner {
            terminals: HashMap::new(),
            theme_context: None,
            database: None,
        }
    }

    fn init_db(&mut self, data_path: &Path) -> Result<()> {
        let mut data_path_buf = data_path.to_path_buf();

        if cfg!(dev) {
            data_path_buf.push("users_dev.db");
        } else {
            data_path_buf.push("users.db");
        }

        let database = Database::open_file(data_path_buf.as_path())?;

        self.database = Some(database);

        Ok(())
    }

    fn insert_terminal(&mut self, terminal: TerminalDelegate) {
        let id = terminal.id();
        self.terminals.insert(id, terminal);
    }

    fn load_themes(&mut self, path: &Path) -> Result<()> {
        let mut theme_context = ThemeContext::new();

        debug!("Load themes from {:?}", path);

        // check if path is a dir
        if !path.is_dir() {
            return Err(Error::NoThemesFound);
        }

        // list all child folder under path
        for entry in path.read_dir()? {
            let entry = entry?;
            debug!("Found {:?}", entry.path());

            let theme_item_opt = ThemeItem::load_from_file(entry.path().as_path())?;
            if let Some(theme_item) = theme_item_opt {
                theme_context.add(theme_item);
            }
        }

        if theme_context.is_empty() {
            return Err(Error::NoThemesFound);
        }

        self.theme_context = Some(theme_context);
        Ok(())
    }

    pub(crate) fn get_a_theme(&self) -> Result<ThemeResponse> {
        let theme_context = self.theme_context.as_ref().unwrap();
        let first = &theme_context[0];

        let content = if let Some(toml_path) = &first.toml_file_path {
            std::fs::read_to_string(toml_path)?
        } else {
            unreachable!()
        };

        Ok(ThemeResponse {
            name: first.name.clone(),
            json_content: Some(toml_str_to_json_str(&content)?),
        })
    }
}

fn toml_str_to_json_str(toml: &str) -> Result<String> {
    let value = toml::from_str::<toml::Value>(toml)?;
    let json = serde_json::to_string(&value)?;
    Ok(json)
}
