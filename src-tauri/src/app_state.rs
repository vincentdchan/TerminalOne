use crate::messages::ThemeResponse;
use crate::terminal_delegate::TerminalDelegate;
use crate::theme_context::{ThemeContext, ThemeItem};
use crate::{Error, Result};
use bson::oid::ObjectId;
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
        buffer_callback: Box<dyn Fn(&TerminalDelegate, &[u8]) -> Result<()> + Send>,
    ) -> Result<TerminalDelegate> {
        let delegate: TerminalDelegate = TerminalDelegate::new(buffer_callback)?;
        {
            let mut inner = self.inner.lock().unwrap();
            inner.insert_terminal(delegate.clone());
        }
        Ok(delegate)
    }

    pub(crate) fn get_terminal_by_id(&self, id: ObjectId) -> TerminalDelegate {
        let inner = self.inner.lock().unwrap();
        inner.terminals.get(&id).unwrap().clone()
    }

    pub(crate) fn remove_terminal_by_id(&self, id: ObjectId) {
        let mut inner = self.inner.lock().unwrap();
        inner.terminals.remove(&id);
    }

    pub(crate) fn load_themes(&self, dir: &Path) -> Result<()> {
        let mut inner = self.inner.lock().unwrap();
        inner.load_themes(dir)
    }

    pub(crate) fn get_a_theme(&self) -> Result<ThemeResponse> {
        let inner = self.inner.lock().unwrap();
        inner.get_a_theme()
    }
}

struct AppStateInner {
    terminals: HashMap<ObjectId, TerminalDelegate>,
    theme_context: Option<ThemeContext>,
}

impl AppStateInner {
    fn new() -> AppStateInner {
        AppStateInner {
            terminals: HashMap::new(),
            theme_context: None,
        }
    }

    fn insert_terminal(&mut self, terminal: TerminalDelegate) {
        let id = terminal.id();
        self.terminals.insert(id, terminal);
    }

    fn load_themes(&mut self, dir: &Path) -> Result<()> {
        let mut theme_context = ThemeContext::new();

        let mut path = dir.to_path_buf();
        path.pop();
        path.push("themes");

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
