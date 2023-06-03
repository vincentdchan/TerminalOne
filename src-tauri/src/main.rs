// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod messages;
mod app_state;
mod terminal_delegate;
pub mod errors;

use std::{vec, str::FromStr, io::Write};
use app_state::AppState;
use bson::oid::ObjectId;
use tauri::State;
pub use errors::Error;
use messages::PtyResponse;
// use portable_pty

pub type Result<T> = std::result::Result<T, errors::Error>;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn new_terminal(window: tauri::Window, state: State<AppState>) -> Result<String> {
    let win_cloned = window.clone();
    let delegate = state.inner().new_terminal(Box::new(move |delegate, buffer| {
        let id_str = delegate.id().to_hex();
        win_cloned.emit("pty-output", PtyResponse {
            id: id_str,
            data: buffer.to_vec(),
        })?;
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

fn main() {

    tauri::Builder::default()
        .manage(AppState::new())
        .setup(|_app| {
            println!("app started");
            // // Use the native pty implementation for the system
            // let pty_system = native_pty_system();

            // // Create a new pty
            // let mut pair = pty_system
            //     .openpty(PtySize {
            //         rows: 24,
            //         cols: 80,
            //         // Not all systems support pixel_width, pixel_height,
            //         // but it is good practice to set it to something
            //         // that matches the size of the selected font.  That
            //         // is more complex than can be shown here in this
            //         // brief example though!
            //         pixel_width: 0,
            //         pixel_height: 0,
            //     })
            //     .unwrap();

            // // Spawn a shell into the pty
            // let cmd = CommandBuilder::new("zsh");
            // let child = pair.slave.spawn_command(cmd).unwrap();

            // drop(pair.slave);

            // // Read and parse output from the pty with reader
            // let mut reader = pair.master.try_clone_reader().unwrap();

            // let main_window = app.get_window("main").unwrap();

            // std::thread::spawn(move || {
            //     println!("begin reader thread");
            //     loop {
            //         // Consume the output from the child
            //         let mut buffer: Vec<u8> = vec![0; 4096];
            //         // let mut s = String::new();
            //         // reader.read_to_string(&mut s).unwrap();

            //         let size = reader.read(&mut buffer).unwrap();

            //         let str = String::from_utf8_lossy(&buffer.as_slice()[0..size]);

            //         println!("output: {:?}", str);

            //         main_window.emit("pty-output", &buffer[0..size]).unwrap();
            //     }
            // });

            // let writer_ref = RefCell::new(pair.master.take_writer().unwrap());
            // if cfg!(target_os = "macos") {
            //     // macOS quirk: the child and reader must be started and
            //     // allowed a brief grace period to run before we allow
            //     // the writer to drop. Otherwise, the data we send to
            //     // the kernel to trigger EOF is interleaved with the
            //     // data read by the reader! WTF!?
            //     // This appears to be a race condition for very short
            //     // lived processes on macOS.
            //     // I'd love to find a more deterministic solution to
            //     // this than sleeping.
            //     std::thread::sleep(std::time::Duration::from_millis(20));
            // }
            // app.listen_global("pty-input", move |event| {
            //     let mut writer = writer_ref.borrow_mut();
            //     let payload = event.payload().unwrap();
            //     println!("input: {:?}", payload);
            //     writer.write_all(payload.as_bytes()).unwrap();
            // });

            return Ok(());
        })
        .invoke_handler(tauri::generate_handler![
            new_terminal,
            send_terminal_data,
            remove_terminal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
