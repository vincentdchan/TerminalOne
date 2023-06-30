// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

mod app_path;
mod app_state;
mod context_menu;
pub mod errors;
mod install_script;
mod mac_ext;
mod menu;
mod messages;
mod terminal_delegate;
mod theme_context;
mod updater;
mod process_statistics;

use crate::mac_ext::WindowExt;
use app_state::AppState;
use base64::{engine::general_purpose, Engine as _};
pub use errors::Error;
use install_script::install_script;
use log::{debug, error, info};
use log4rs::append::console::ConsoleAppender;
use log4rs::append::rolling_file::policy::compound::roll::delete::DeleteRoller;
use log4rs::append::rolling_file::policy::compound::trigger::size::SizeTrigger;
use log4rs::append::rolling_file::policy::compound::CompoundPolicy;
use log4rs::append::rolling_file::RollingFileAppender;
use log4rs::config::{Appender, Config, Root};
use log4rs::encode::pattern::PatternEncoder;
use messages::*;
use polodb_core::bson::Bson;
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
use tauri::{async_runtime, Manager, State, AppHandle};
use terminal_delegate::TerminalDelegateEventHandler;
// use portable_pty

pub type Result<T> = std::result::Result<T, errors::Error>;
const CHANGELOG_LINK: &str = "https://www.terminalone.app/changelog";
const DISCORD_LINK: &str = "https://discord.gg/8vmYtHSP5m";
const TWITTER_LINK: &str = "https://twitter.com/terminalone_app";

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
        let data64 = general_purpose::STANDARD_NO_PAD.encode(data);
        self.window.emit(
            messages::push_event::PTY_OUTPUT,
            PtyResponse {
                id: id_str,
                data64: data64,
            },
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

    let docs = state.inner().fetch_all_ui_stores()?;

    debug!("init ui stores: {:?}", docs);

    let mut json_doc = serde_json::map::Map::new();

    for doc in &docs {
        let test_key = match doc.get("_id") {
            Some(Bson::String(str)) => str.clone(),
            _ => {
                continue;
            }
        };

        let test_value = match doc.get("value") {
            Some(v) => v.clone(),
            _ => {
                continue;
            }
        };

        let json_value = serde_json::to_value(test_value)?;
        json_doc.insert(test_key, json_value);
    }

    let mut force_onboarding = false;

    if std::env::var("T1_FORCE_ONBOARDING").is_ok() {
        force_onboarding = true;
    }

    Ok(messages::InitMessage {
        home_dir,
        force_onboarding,
        ui_stores: serde_json::Value::Object(json_doc),
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
    let _delegate = state
        .inner()
        .new_terminal(id, path, events_handler)?;
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
fn ui_store(state: State<AppState>, doc: serde_json::Value) -> Result<()> {
    let bson_doc = polodb_core::bson::to_document(&doc)?;
    state.ui_store(bson_doc)?;
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
fn get_all_favorite_folders(state: State<AppState>) -> Result<Vec<serde_json::Value>> {
    let docs = state.inner().get_all_favorite_folders()?;
    let mut result = Vec::new();

    for doc in docs {
        result.push(serde_json::to_value(doc)?);
    }

    Ok(result)
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
    let app_log_dir = app_path::app_log_dir("Terminal One").expect("no log dirs");

    if cfg!(dev) {
        let stdout = ConsoleAppender::builder()
            .encoder(Box::new(PatternEncoder::new(
                "{d(%Y-%m-%d %H:%M:%S %Z)} {h({l})} {I} {m}{n}",
            )))
            .build();
        let config = Config::builder()
            .appender(Appender::builder().build("stdout", Box::new(stdout)))
            .build(
                Root::builder()
                    .appender("stdout")
                    .build(log::LevelFilter::max()),
            )
            .unwrap();

        let _handle = log4rs::init_config(config).unwrap();
    } else {
        let _ = std::fs::create_dir(&app_log_dir);

        let file_path = app_log_dir.join("TerminalOne.log");
        let file = RollingFileAppender::builder()
            .encoder(Box::new(PatternEncoder::new(
                "{d(%Y-%m-%d %H:%M:%S %Z)} {h({l})} {I} {m}{n}",
            )))
            .build(
                file_path,
                Box::new(CompoundPolicy::new(
                    Box::new(SizeTrigger::new(10_000_000)),
                    Box::new(DeleteRoller::new()),
                )),
            )
            .expect("build rolling file appender failed");
        let config = Config::builder()
            .appender(Appender::builder().build("file", Box::new(file)))
            .build(
                Root::builder()
                    .appender("file")
                    .build(log::LevelFilter::Info),
            )
            .unwrap();

        let _handle = log4rs::init_config(config).unwrap();
    }

    debug!("debug env");

    let menu = menu::generate_menu("Terminal One");

    // print all envs
    // std::env::vars().for_each(|(k, v)| {
    //     info!("env: {}: {}", k, v);
    // });

    tauri::Builder::default()
        .menu(menu)
        .manage(AppState::new())
        .setup(move |app| {
            let win = app.get_window("main").unwrap();
            win.set_transparent_titlebar(true);
            win.position_traffic_lights(15.0, 14.0, 42.0);

            let mut sys = System::new_all();
            sys.refresh_all();

            let config = app.config();
            let app_data_dir = app_path::app_data_dir(&config).expect("no app data");

            let _ = std::fs::create_dir(&app_data_dir);

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
