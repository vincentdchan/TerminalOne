// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_state;
pub mod errors;
mod messages;
mod terminal_delegate;
mod theme_context;

use app_state::AppState;
use bson::oid::ObjectId;
pub use errors::Error;
use log::{debug, info};
use messages::{PtyResponse, ThemeResponse};
use std::{env, io::Write, str::FromStr, vec};
use sysinfo::{System, SystemExt};
use tauri::{State, Manager};
// use portable_pty

pub type Result<T> = std::result::Result<T, errors::Error>;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn new_terminal(window: tauri::Window, state: State<AppState>) -> Result<String> {
    let win_cloned = window.clone();
    let delegate = state
        .inner()
        .new_terminal(Box::new(move |delegate, buffer| {
            let id_str = delegate.id().to_hex();
            win_cloned.emit(
                "pty-output",
                PtyResponse {
                    id: id_str,
                    data: buffer.to_vec(),
                },
            )?;
            Ok(())
        }))?;
    let id = delegate.id();
    let id_str = id.to_hex();
    Ok(id_str)
}

#[tauri::command]
fn send_terminal_data(state: State<AppState>, id: &str, data: &str) -> Result<()> {
    let oid = ObjectId::from_str(id)?;

    let mut delegate = state.inner().get_terminal_by_id(oid);

    delegate.write(data.as_bytes())?;

    Ok(())
}

#[tauri::command]
fn remove_terminal(state: State<AppState>, id: &str) -> Result<()> {
    let oid = ObjectId::from_str(id)?;

    state.inner().remove_terminal_by_id(oid);

    Ok(())
}

#[tauri::command]
fn get_a_theme(state: State<AppState>) -> Result<ThemeResponse> {
    state.inner().get_a_theme()
}

fn main() {
    let filter_level = if cfg!(dev) {
        log::LevelFilter::max()
    } else {
        log::LevelFilter::Info
    };
    env_logger::builder()
        .filter_level(filter_level)
        .init();

    debug!("debug env");

    tauri::Builder::default()
        .manage(AppState::new())
        .setup(|app| {
            let cargo_path = env!("CARGO_MANIFEST_DIR");
            let current_dir = env::current_dir()?;
            let mut sys = System::new_all();
            sys.refresh_all();

            info!("GPTerminal started ~");
            info!("app started: {}", current_dir.to_str().unwrap());
            info!("cargo manifest: {}", cargo_path);
            // Display system information:
            info!("System name:             {:?}", sys.name());
            info!("System kernel version:   {:?}", sys.kernel_version());
            info!("System OS version:       {:?}", sys.os_version());
            info!("System host name:        {:?}", sys.host_name());

            // Number of CPUs:
            info!("NB CPUs: {}", sys.cpus().len());

            let state = app.state::<AppState>();
            state.inner().load_themes(&current_dir)?;

            return Ok(());
        })
        .invoke_handler(tauri::generate_handler![
            new_terminal,
            send_terminal_data,
            remove_terminal,
            get_a_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
