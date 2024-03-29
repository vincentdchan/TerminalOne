use crate::messages::ThemeResponse;
use crate::terminal_delegate::{TerminalDelegate, TerminalDelegateEventHandler};
use crate::theme_context::{ThemeContext, ThemeItem};
use crate::{Error, Result};
use log::{info, debug, warn};
use polodb_core::mac_proxy_settings;
use serde_json::Value;
use tauri::Wry;
use tauri::updater::UpdateResponse;
use std::collections::{HashMap, BTreeMap};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use crate::settings::Settings;

#[derive(Clone)]
pub(crate) struct AppState {
    inner: Arc<Mutex<AppStateInner>>,
}

impl AppState {
    pub(crate) fn new(shell_path: PathBuf, settings: Settings) -> AppState {
        let settings_arc = Arc::new(settings);
        let inner = AppStateInner::new(shell_path, settings_arc);
        AppState {
            inner: Arc::new(Mutex::new(inner)),
        }
    }

    pub(crate) fn new_terminal(
        &self,
        id: String,
        path: Option<String>,
        event_handler: Box<dyn TerminalDelegateEventHandler + Send>,
    ) -> Result<TerminalDelegate> {
        let envs = {
            let inner = self.inner.lock().unwrap();
            inner.preserved_envs.clone()
        };
        let shell_path = {
            let inner = self.inner.lock().unwrap();
            inner.shell_path.clone()
        };
        // The new operation is slow.
        // So we don't want to obtain the lock when creating a new terminal.
        let delegate: TerminalDelegate = TerminalDelegate::new(
            id,
            path,
            shell_path,
            envs,
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

    pub(crate) fn ui_store(&self, key: String, value: serde_json::Value) -> Result<()> {
        let inner = self.inner.lock().unwrap();
        let db_opt = inner.database.as_ref();
        if db_opt.is_none() {
            warn!("db is none");
            return Ok(())
        }
        let db = db_opt.unwrap();

        // warp value into json object
        let value_obj = serde_json::json!({
            "value": value,
        });
        let value_str = serde_json::to_string(&value_obj)?;

        // inert to update
        db.execute(
            "INSERT OR REPLACE INTO ui_store (key, value) VALUES (?, ?)",
            (&key, &value_str),
        )?;

        debug!("ui store insert key: {}, value: {:?}", key, value_str);

        Ok(())
    }

    pub (crate) fn fetch_all_ui_stores(&self) -> Result<Vec<(String, String)>> {
        let inner = self.inner.lock().unwrap();
        let db_opt = inner.database.as_ref();

        if db_opt.is_none() {
            warn!("db is none");
            return Ok(Vec::new());
        }

        let db = db_opt.unwrap();

        let mut stmt = db.prepare("SELECT key, value FROM ui_store")?;

        let tuple_iter = stmt.query_map([], |row| {
            let key = row.get(0)?;
            let value = row.get(1)?;
            Ok((key, value))
        })?;

        let result = tuple_iter.collect::<rusqlite::Result<Vec<(String, String)>>>()?;

        Ok(result)
    }

    pub(crate) fn add_favorite_folder(&self, path: &str) -> Result<()> {
        let inner = self.inner.lock().unwrap();
        let db_opt = inner.database.as_ref();

        if db_opt.is_none() {
            warn!("db is none");
            return Ok(());
        }

        let db = db_opt.unwrap();
        
        let query = "INSERT INTO favorite_folders (path) VALUES (?)";

        db.execute(query, [&path])?;

        debug!("insert favorite folder: {}", path);

        Ok(())
    }

    pub(crate) fn remove_favorite_folder(&self, path: &str) -> Result<()> {
        let inner = self.inner.lock().unwrap();
        let db_opt = inner.database.as_ref();

        if db_opt.is_none() {
            warn!("db is none");
            return Ok(());
        }

        let db = db_opt.unwrap();
        
        let query = "DELETE FROM favorite_folders WHERE path = ?";

        db.execute(query, [&path])?;

        debug!("delete favorite folder: {}", path);

        Ok(())
    }

    pub(crate) fn get_all_favorite_folders(&self) -> Result<Vec<String>> {
        let inner = self.inner.lock().unwrap();
        let db_opt = inner.database.as_ref();

        if db_opt.is_none() {
            warn!("db is none");
            return Ok(Vec::new());
        }

        let db = db_opt.unwrap();
        
        let mut stmt = db.prepare("SELECT id, path FROM favorite_folders")?;

        let path_iter = stmt.query_map([], |row| {
            let path: String = row.get(1)?;
            Ok(path)
        })?;

        let result = path_iter.collect::<rusqlite::Result<Vec<String>>>()?;

        Ok(result)
    }

    pub(crate) fn set_update(&self, update: UpdateResponse<Wry>) {
        let mut inner = self.inner.lock().unwrap();
        inner.set_update(update)
    }

    pub(crate) fn take_update(&self) -> Option<UpdateResponse<Wry>> {
        let mut inner = self.inner.lock().unwrap();
        let update_opt = inner.update.take();
        update_opt
    }

    pub(crate) fn settings(&self) -> Arc<Settings> {
        let inner = self.inner.lock().unwrap();
        inner.settings.clone()
    }

}

struct AppStateInner {
    shell_path: PathBuf,
    settings: Arc<Settings>,
    terminals: HashMap<String, TerminalDelegate>,
    preserved_envs: BTreeMap<String, Option<String>>,
    theme_context: Option<ThemeContext>,
    database: Option<rusqlite::Connection>,
    update: Option<UpdateResponse<Wry>>,
}


fn get_preserved_envs() -> BTreeMap<String, Option<String>> {
    let preserved_envs_keys: Vec<&str> = vec![
        "HTTP_PROXY",
        "http_proxy",
        "HTTPS_PROXY",
        "https_proxy",
        "NO_PROXY",
        "no_proxy",
        "ALL_PROXY",
        "all_proxy",
    ];
    let mut result = BTreeMap::new();

    for key in preserved_envs_keys {
        let value = std::env::var(key).ok();
        let exists = value.is_some();
        result.insert(key.to_string(), value);

        if exists {
            std::env::remove_var(key);
        }
    }

    return result;
}

fn try_set_http_proxy(system_proxy: &serde_json::Map<String, serde_json::Value>) {
    match (system_proxy.get("HTTPEnable"), system_proxy.get("HTTPProxy"), system_proxy.get("HTTPPort")) {
        (Some(Value::Number(n)), Some(Value::String(proxy)), Some(Value::Number(port))) => {
            if n.as_u64().unwrap() != 1 {
                return;
            }
            let value = format!("http://{}:{}", proxy, port);
            info!("==> set HTTP_PROXY: {}", value);
            std::env::set_var("HTTP_PROXY", value);
        }
        _ => ()
    }
}

fn try_set_https_proxy(system_proxy: &serde_json::Map<String, serde_json::Value>) {
    match (system_proxy.get("HTTPSEnable"), system_proxy.get("HTTPSProxy"), system_proxy.get("HTTPSPort")) {
        (Some(Value::Number(n)), Some(Value::String(proxy)), Some(Value::Number(port))) => {
            if n.as_u64().unwrap() != 1 {
                return;
            }
            let value = format!("http://{}:{}", proxy, port);
            info!("==> set HTTPS_PROXY: {}", value);
            std::env::set_var("HTTPS_PROXY", value);
        }
        _ => ()
    }
}

impl AppStateInner {
    fn new(shell_path: PathBuf, settings: Arc<Settings>) -> AppStateInner {
        let preserved_envs = get_preserved_envs();
        debug!("preserved_envs: {:?}", preserved_envs);

        let result = AppStateInner {
            shell_path,
            settings,
            terminals: HashMap::new(),
            preserved_envs,
            theme_context: None,
            database: None,
            update: None,
        };

        result.init_proxy();

        result
    }

    fn init_proxy(&self) {
        let system_proxy = mac_proxy_settings();
        debug!("system: proxy setting: {:?}", system_proxy);
        if system_proxy.is_none() {
            return;
        }

        let system_proxy = system_proxy.unwrap();

        try_set_http_proxy(&system_proxy);
        try_set_https_proxy(&system_proxy);
    }

    fn init_db(&mut self, data_path: &Path) -> Result<()> {
        let mut data_path_buf = data_path.to_path_buf();

        if cfg!(dev) {
            data_path_buf.push("users_dev.sqlite");
        } else {
            data_path_buf.push("users.sqlite");
        }

        let database = crate::database::open_database(data_path_buf.as_path())?;

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

    pub(crate) fn set_update(&mut self, update: UpdateResponse<Wry>) {
        self.update = Some(update);
    }
}

fn toml_str_to_json_str(toml: &str) -> Result<String> {
    let value = toml::from_str::<toml::Value>(toml)?;
    let json = serde_json::to_string(&value)?;
    Ok(json)
}
