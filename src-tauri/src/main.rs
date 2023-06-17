// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

mod app_path;
mod app_state;
pub mod errors;
mod mac_ext;
mod messages;
mod terminal_delegate;
mod theme_context;
mod updater;
mod menu;

use crate::mac_ext::WindowExt;
use app_state::AppState;
pub use errors::Error;
use log::{debug, info};
use messages::{
    FileItem, FsLsResponse, FsStatResponse, PtyExitMessage, PtyResponse, ThemeResponse,
};
use portable_pty::ExitStatus;
use std::{
    env, fs,
    io::Write,
    time::{SystemTime, UNIX_EPOCH},
    vec,
};
use sysinfo::{System, SystemExt};
use tauri::{Manager,  State, async_runtime};
use terminal_delegate::TerminalDelegateEventHandler;
use log4rs::append::console::ConsoleAppender;
use log4rs::append::rolling_file::RollingFileAppender;
use log4rs::config::{Appender, Config, Root};
use log4rs::encode::pattern::PatternEncoder;
use log4rs::append::rolling_file::policy::compound::CompoundPolicy;
use log4rs::append::rolling_file::policy::compound::trigger::size::SizeTrigger;
use log4rs::append::rolling_file::policy::compound::roll::delete::DeleteRoller;
// use portable_pty

pub type Result<T> = std::result::Result<T, errors::Error>;

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
        self.window.emit(
            messages::push_event::PTY_OUTPUT,
            PtyResponse {
                id: id_str,
                data: data.to_vec(),
            },
        )?;
        Ok(())
    }

    fn handle_exit(&self, id: String, _exit_code: ExitStatus) -> Result<()> {
        self.window
            .emit(messages::push_event::PTY_EXIT, PtyExitMessage { id })?;
        Ok(())
    }
}

#[tauri::command]
fn fetch_init_data() -> Result<messages::InitMessage> {
    let home_dir = dirs::home_dir().unwrap().to_str().unwrap().to_string();
    Ok(messages::InitMessage { home_dir })
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn new_terminal(app_handle: tauri::AppHandle, window: tauri::Window, state: State<AppState>, id: String) -> Result<()> {
    let shell_path = app_handle.path_resolver()
        .resolve_resource("shell_integration")
        .expect("no shell integration found");

    let events_handler: Box<dyn TerminalDelegateEventHandler + Send + Sync> =
        Box::new(MainTerminalEventHandler {
            window: window.clone(),
        });
    let _delegate = state.inner().new_terminal(
        id,
        &shell_path,
        events_handler,
    )?;
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


fn main() {
    let app_log_dir = app_path::app_log_dir("Terminal One").expect("no log dirs");

    if cfg!(dev) {
        let stdout = ConsoleAppender::builder()
            .encoder(Box::new(PatternEncoder::new("{d(%Y-%m-%d %H:%M:%S %Z)} {h({l})} {I} {m}{n}")))
            .build();
        let config = Config::builder()
            .appender(Appender::builder().build("stdout", Box::new(stdout)))
            .build(Root::builder().appender("stdout").build(log::LevelFilter::max()))
            .unwrap();

        let _handle = log4rs::init_config(config).unwrap();
    } else {
        let _ = std::fs::create_dir(&app_log_dir);

        let file_path = app_log_dir.join("TerminalOne.log");
        let file = RollingFileAppender::builder()
            .encoder(Box::new(PatternEncoder::new("{d(%Y-%m-%d %H:%M:%S %Z)} {h({l})} {I} {m}{n}")))
            .build(
                file_path,
                Box::new(CompoundPolicy::new(
                    Box::new(SizeTrigger::new(10_000_000)),
                    Box::new(DeleteRoller::new()),
                )),
            ).expect("build rolling file appender failed");
        let config = Config::builder()
            .appender(Appender::builder().build("file", Box::new(file)))
            .build(Root::builder().appender("file").build(log::LevelFilter::Info))
            .unwrap();

        let _handle = log4rs::init_config(config).unwrap();
    }

    debug!("debug env");

    let menu = menu::generate_menu("Terminal One");

    tauri::Builder::default()
        .menu(menu)
        .manage(AppState::new())
        .setup(move |app| {
            let win = app.get_window("main").unwrap();
            win.set_transparent_titlebar(true);
            win.position_traffic_lights(15.0, 19.0);

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

            let theme_path = app.path_resolver()
                .resolve_resource("themes")
                .expect("failed to resolve resource");

            state.inner().load_themes(&theme_path)?;

            async_runtime::spawn(async {
                use tokio::time::Duration;

                tokio::time::sleep(Duration::from_secs(10)).await;
                debug!("child thread");

                let _ = updater::check_update().await;
            });

            return Ok(());
        })
        .invoke_handler(tauri::generate_handler![
            fetch_init_data,
            new_terminal,
            send_terminal_data,
            remove_terminal,
            get_a_theme,
            resize_pty,
            launch_url,
            fs_ls,
            fs_read_all,
            fs_stat,
        ])
        .on_menu_event(|event| match event.menu_item_id() {
            "settings" => {
                info!("settings")
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
