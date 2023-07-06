// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

mod app_path;
mod app_state;
mod context_menu;
mod database;
pub mod errors;
mod install_script;
mod logs;
mod mac_ext;
mod menu;
mod messages;
mod process_statistics;
pub mod settings;
mod terminal_delegate;
mod theme_context;
mod updater;

use crate::mac_ext::WindowExt;
use app_state::AppState;
pub use errors::Error;
use install_script::install_script;
use log::{debug, error, info};
use messages::*;
use portable_pty::ExitStatus;
use process_statistics::StatResult;
use std::collections::HashMap;
use std::path::PathBuf;
use std::{
    env, fs,
    io::Write,
    time::{SystemTime, UNIX_EPOCH},
    vec,
};
use sysinfo::{System, SystemExt};
use tauri::{async_runtime, AppHandle, Manager, State};
use terminal_delegate::TerminalDelegateEventHandler;
// use portable_pty

pub type Result<T> = std::result::Result<T, errors::Error>;
const CHANGELOG_LINK: &str = "https://www.terminalone.app/changelog";
const DISCORD_LINK: &str = "https://discord.gg/8vmYtHSP5m";
const TWITTER_LINK: &str = "https://twitter.com/terminalone_app";
const APP_NAME: &str = "Terminal One";

struct MainTerminalEventHandler {
    window: tauri::Window,
}

impl TerminalDelegateEventHandler for MainTerminalEventHandler {
    fn handle_data(
        &self,
        terminal_delegate: &terminal_delegate::TerminalDelegate,
        data: &[u8],
    ) -> Result<()> {
        let id_str = terminal_delegate.id();
        // data to string unchecked utf8
        let data = unsafe { String::from_utf8_unchecked(data.to_vec()) };
        self.window.emit(
            messages::push_event::PTY_OUTPUT,
            PtyResponse { id: id_str, data },
        )?;
        Ok(())
    }

    fn handle_exit(&self, id: String, _exit_code: ExitStatus) -> Result<()> {
        self.window
            .emit(messages::push_event::PTY_EXIT, PtyExitMessage { id })?;
        Ok(())
    }

    fn handle_fs_changed(&self, id: String, paths: Vec<String>) -> Result<()> {
        self.window.emit(
            messages::push_event::FS_CHANGED,
            FsChangedMessage { id, paths },
        )?;
        Ok(())
    }
}

#[tauri::command]
fn fetch_init_data(app: AppHandle, state: State<AppState>) -> Result<messages::InitMessage> {
    let win = app.get_window("main").unwrap();
    set_debug_icon(win, app);

    let home_dir = dirs::home_dir().unwrap().to_str().unwrap().to_string();

    let settings = state.inner().settings();
    let docs = state.inner().fetch_all_ui_stores()?;

    debug!("init ui stores: {:?}", docs);

    let mut json_doc = serde_json::map::Map::new();

    for (key, value) in &docs {
        let json = serde_json::from_str::<serde_json::Value>(value)?;
        let json_value = json.as_object().unwrap().get("value").unwrap();
        json_doc.insert(key.clone(), json_value.clone());
    }

    let mut force_onboarding = false;

    if std::env::var("T1_FORCE_ONBOARDING").is_ok() {
        force_onboarding = true;
    }

    Ok(messages::InitMessage {
        home_dir,
        force_onboarding,
        ui_stores: serde_json::Value::Object(json_doc),
        settings: settings.as_ref().clone(),
    })
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn new_terminal(
    window: tauri::Window,
    state: State<AppState>,
    id: String,
    path: Option<String>,
) -> Result<()> {
    let events_handler: Box<dyn TerminalDelegateEventHandler + Send + Sync> =
        Box::new(MainTerminalEventHandler {
            window: window.clone(),
        });
    let _delegate = state.inner().new_terminal(id, path, events_handler)?;
    Ok(())
}

#[tauri::command]
fn resize_pty(state: State<AppState>, id: &str, rows: u16, cols: u16) -> Result<()> {
    let delegate = state.inner().get_terminal_by_id(id);

    delegate.resize(rows, cols)
}

#[tauri::command]
fn send_terminal_data(state: State<AppState>, id: &str, data: &str) -> Result<()> {
    let mut delegate = state.inner().get_terminal_by_id(id);

    delegate.write(data.as_bytes())?;

    Ok(())
}

#[tauri::command]
fn get_terminal_statistics(state: State<AppState>, id: &str) -> StatResult {
    let delegate = state.inner().get_terminal_by_id(id);

    delegate.fetch_statistics()
}

#[tauri::command]
fn terminal_set_options(state: State<AppState>, id: &str, options: TermOptions) -> Result<()> {
    let delegate = state.inner().get_terminal_by_id(id);

    delegate.set_options(options)?;

    Ok(())
}

#[tauri::command]
fn remove_terminal(state: State<AppState>, id: &str) -> Result<()> {
    state.inner().remove_terminal_by_id(id);

    Ok(())
}

#[tauri::command]
fn get_a_theme(state: State<AppState>) -> Result<ThemeResponse> {
    state.inner().get_a_theme()
}

#[tauri::command]
fn launch_url(url: &str) -> Result<()> {
    info!("launch url: {}", url);
    open::that(url)?;
    Ok(())
}

#[tauri::command]
fn fs_ls(path: String) -> Result<FsLsResponse> {
    let mut resp = FsLsResponse::default();

    let entries = fs::read_dir(path)?;

    for entry in entries {
        let file = entry?;
        let filename = file.file_name();
        let file_type = file.file_type()?;
        let path = file.path();

        resp.content.push(FileItem {
            filename: filename.to_str().unwrap().to_string(),
            is_dir: file_type.is_dir(),
            path: path.to_str().unwrap().to_string(),
        });
    }

    Ok(resp)
}

#[tauri::command]
fn fs_read_all(path: &str) -> Result<String> {
    let resp = std::fs::read_to_string(path)?;
    Ok(resp)
}

#[inline]
fn sys_time_to_millis(time: SystemTime) -> Result<u64> {
    return Ok(time.duration_since(UNIX_EPOCH)?.as_millis() as u64);
}

#[tauri::command]
fn fs_stat(path: &str) -> Result<FsStatResponse> {
    let resp = std::fs::metadata(path)?;
    return Ok(FsStatResponse {
        modified_time: sys_time_to_millis(resp.modified()?)?,
        accessed_time: sys_time_to_millis(resp.accessed()?)?,
        created_time: sys_time_to_millis(resp.created()?)?,
    });
}

#[tauri::command]
fn ui_store(state: State<AppState>, key: String, value: serde_json::Value) -> Result<()> {
    state.ui_store(key, value)?;
    Ok(())
}

#[tauri::command]
async fn spawn_command(
    command: &str,
    cwd: &str,
    args: Option<Vec<String>>,
    envs: Option<HashMap<String, String>>,
) -> Result<SpawnResult> {
    debug!(
        "spawn command: {:?}, cwd: {:?}, env: {:?}",
        command, cwd, envs
    );

    let mut command = tokio::process::Command::new(command);

    if let Some(args) = &args {
        command.args(args);
    }

    if let Some(envs) = &envs {
        command.envs(envs);
    }

    command.current_dir(cwd);

    let output = command.output().await?;

    let code = output.status.code().clone();
    let success = output.status.success();
    Ok(SpawnResult {
        output: String::from_utf8_lossy(&output.stdout).to_string(),
        success,
        code,
    })
}

#[tauri::command]
fn add_favorite_folder(state: State<AppState>, path: &str) -> Result<()> {
    state.inner().add_favorite_folder(path)?;
    Ok(())
}

#[tauri::command]
fn remove_favorite_folder(state: State<AppState>, path: &str) -> Result<()> {
    state.inner().remove_favorite_folder(path)?;
    Ok(())
}

#[tauri::command]
fn get_all_favorite_folders(state: State<AppState>) -> Result<Vec<String>> {
    let docs = state.inner().get_all_favorite_folders()?;

    Ok(docs)
}

#[tauri::command]
fn batch_test_files(req: BatchTestFilesReq) -> Result<BatchTestFilesResp> {
    let mut files = Vec::new();
    let current_path = PathBuf::from(&req.current_dir);

    for file in &req.files {
        let mut path = current_path.clone();
        path.push(file);

        let test_stat = fs::metadata(&path);
        match test_stat {
            Ok(stat) => {
                if stat.is_dir() {
                    files.push(1);
                } else {
                    files.push(2);
                }
            }
            Err(_) => files.push(0),
        }
    }

    Ok(BatchTestFilesResp { files })
}

#[tauri::command]
fn install_update(state: State<AppState>) {
    let app_state: AppState = state.inner().clone().clone();
    async_runtime::spawn(async move {
        let update = app_state.take_update();
        if let Some(update) = update {
            let result = update.download_and_install().await;
            if let Err(e) = result {
                error!("install update error: {}", e);
            }
        }
    });
}

#[tauri::command]
fn open_context_menu(window: tauri::Window, req: OpenContextMenuReq) {
    context_menu::open(window, req)
}

#[cfg(debug_assertions)]
fn set_debug_icon(win: tauri::Window, app_handle: tauri::AppHandle) {
    let debug_icon_path = app_handle
        .path_resolver()
        .resolve_resource("static/icon-debug.png")
        .expect("no shell integration found");
    let debug_icon_path = debug_icon_path.to_str().unwrap().to_string();
    win.set_app_icon_image(&debug_icon_path);
}

#[cfg(not(debug_assertions))]
fn set_debug_icon(_win: tauri::Window, _app_handle: tauri::AppHandle) {
    // nothing
}

fn main() {
    let app_log_dir = app_path::app_log_dir(APP_NAME).expect("no log dirs");
    let app_data_dir = app_path::app_data_dir(APP_NAME).expect("no data dirs");

    logs::init_logs(app_log_dir.as_path());

    debug!("debug env");

    let menu = menu::generate_menu(APP_NAME);

    let _ = std::fs::create_dir(&app_data_dir);

    let settings = settings::read_init_settings(&app_data_dir);
    debug!("settings: {:?}", settings);

    // print all envs
    // std::env::vars().for_each(|(k, v)| {
    //     info!("env: {}: {}", k, v);
    // });

    tauri::Builder::default()
        .menu(menu)
        .manage(AppState::new(settings))
        .setup(move |app| {
            let win = app.get_window("main").unwrap();
            win.set_transparent_titlebar(true);
            win.position_traffic_lights(15.0, 14.0, 42.0);

            let mut sys = System::new_all();
            sys.refresh_all();

            info!("Terminal One started ~");
            // Display system information:
            info!("System name:             {:?}", sys.name());
            info!("System kernel version:   {:?}", sys.kernel_version());
            info!("System OS version:       {:?}", sys.os_version());
            info!("System host name:        {:?}", sys.host_name());
            info!("System architecture:     {:?}", std::env::consts::ARCH);
            info!("App data dir:            {:?}", app_data_dir);
            info!("App log dir:             {:?}", app_log_dir);

            // Number of CPUs:
            info!("NB CPUs: {}", sys.cpus().len());

            let state = app.state::<AppState>();
            state.inner().init_db(&app_data_dir)?;

            let theme_path = app
                .path_resolver()
                .resolve_resource("themes")
                .expect("failed to resolve resource");

            state.inner().load_themes(&theme_path)?;

            let app_handle = app.handle();
            updater::spawn_thread_to_check_update(app_handle);

            return Ok(());
        })
        .invoke_handler(tauri::generate_handler![
            fetch_init_data,
            new_terminal,
            send_terminal_data,
            get_terminal_statistics,
            terminal_set_options,
            remove_terminal,
            get_a_theme,
            resize_pty,
            launch_url,
            fs_ls,
            fs_read_all,
            fs_stat,
            ui_store,
            spawn_command,
            add_favorite_folder,
            remove_favorite_folder,
            get_all_favorite_folders,
            batch_test_files,
            install_update,
            install_script,
            open_context_menu,
        ])
        .on_menu_event(|event| match event.menu_item_id() {
            "settings" => {
                info!("settings")
            }
            "changelog" => {
                let result = open::that(CHANGELOG_LINK);
                if let Err(err) = result {
                    error!("open changelog error: {}", err);
                }
            }
            "join-discord" => {
                let result = open::that(DISCORD_LINK);
                if let Err(err) = result {
                    error!("open discord error: {}", err);
                }
            }
            "follow-twitter" => {
                let result = open::that(TWITTER_LINK);
                if let Err(err) = result {
                    error!("open twitter error: {}", err);
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
