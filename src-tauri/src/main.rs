// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

mod app_state;
pub mod errors;
mod messages;
mod terminal_delegate;
mod theme_context;

use app_state::AppState;
use bson::oid::ObjectId;
use cocoa::appkit::{NSWindow, NSWindowStyleMask};
pub use errors::Error;
use log::{debug, info};
use messages::{PtyResponse, ThemeResponse};
use std::{env, io::Write, str::FromStr, vec};
use sysinfo::{System, SystemExt};
use tauri::{Manager, Runtime, State, Window};
// use portable_pty

pub type Result<T> = std::result::Result<T, errors::Error>;

pub trait WindowExt {
    #[cfg(target_os = "macos")]
    fn set_transparent_titlebar(&self, transparent: bool);
    #[cfg(target_os = "macos")]
    fn position_traffic_lights(&self, x: f64, y: f64);
}

impl<R: Runtime> WindowExt for Window<R> {
    #[cfg(target_os = "macos")]
    fn set_transparent_titlebar(&self, transparent: bool) {
        use cocoa::appkit::NSWindowTitleVisibility;

        unsafe {
            let id = self.ns_window().unwrap() as cocoa::base::id;

            let mut style_mask = id.styleMask();
            style_mask.set(
                NSWindowStyleMask::NSFullSizeContentViewWindowMask,
                transparent,
            );
            id.setStyleMask_(style_mask);

            id.setTitleVisibility_(if transparent {
                NSWindowTitleVisibility::NSWindowTitleHidden
            } else {
                NSWindowTitleVisibility::NSWindowTitleVisible
            });
            id.setTitlebarAppearsTransparent_(if transparent {
                cocoa::base::YES
            } else {
                cocoa::base::NO
            });
        }
    }
    #[cfg(target_os = "macos")]
    fn position_traffic_lights(&self, x: f64, y: f64) {
        use cocoa::appkit::{NSView, NSWindow, NSWindowButton};
        use cocoa::foundation::NSRect;

        let window = self.ns_window().unwrap() as cocoa::base::id;

        unsafe {
            let close = window.standardWindowButton_(NSWindowButton::NSWindowCloseButton);
            let miniaturize =
                window.standardWindowButton_(NSWindowButton::NSWindowMiniaturizeButton);
            let zoom = window.standardWindowButton_(NSWindowButton::NSWindowZoomButton);

            let title_bar_container_view = close.superview().superview();

            let close_rect: NSRect = msg_send![close, frame];
            let button_height = close_rect.size.height;

            let title_bar_frame_height = button_height + y;
            let mut title_bar_rect = NSView::frame(title_bar_container_view);
            title_bar_rect.size.height = title_bar_frame_height;
            title_bar_rect.origin.y = NSView::frame(window).size.height - title_bar_frame_height;
            let _: () = msg_send![title_bar_container_view, setFrame: title_bar_rect];

            let window_buttons = vec![close, miniaturize, zoom];
            let space_between = NSView::frame(miniaturize).origin.x - NSView::frame(close).origin.x;

            for (i, button) in window_buttons.into_iter().enumerate() {
                let mut rect: NSRect = NSView::frame(button);
                rect.origin.x = x + (i as f64 * space_between);
                button.setFrameOrigin(rect.origin);
            }
        }
    }
}

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
fn resize_pty(state: State<AppState>, id: &str, rows: u16, cols: u16) -> Result<()> {
    let oid = ObjectId::from_str(id)?;

    let delegate = state.inner().get_terminal_by_id(oid);

    delegate.resize(rows, cols)
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
    env_logger::builder().filter_level(filter_level).init();

    debug!("debug env");

    tauri::Builder::default()
        .manage(AppState::new())
        .setup(|app| {
            let win = app.get_window("main").unwrap();
            win.set_transparent_titlebar(true);
            win.position_traffic_lights(15.0, 19.0);

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
            resize_pty,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
