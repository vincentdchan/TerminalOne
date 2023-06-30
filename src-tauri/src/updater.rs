use crate::{AppState, Result};
use log::{debug, error, info};
use sysinfo::{System, SystemExt};
use tauri::{async_runtime, AppHandle, Manager};

pub async fn check_update(app_handle: AppHandle) -> Result<bool> {
    let cloned_app_handle = app_handle.clone();
    let machine_id = {
        let machine_id_opt = machine_uid::get();
        if machine_id_opt.is_err() {
            error!("can not get machine id");
            return Ok(false);
        }
        machine_id_opt.unwrap()
    };

    debug!("Device ID: {:?}", machine_id);

    let mut sys = System::new_all();
    sys.refresh_all();

    let platform = {
        let os_name = sys.name();
        if os_name.is_none() {
            error!("can not get sys name");
            return Ok(false);
        }
        os_name.unwrap().to_lowercase()
    };

    let os_version = match sys.os_version() {
        Some(s) => s,
        None => "".to_string(),
    };

    let arch = std::env::consts::ARCH;
    let version = env!("CARGO_PKG_VERSION");

    let user_agent = format!(
        "TerminalOne/{} ({}; {}; {})",
        version, platform, arch, os_version
    );

    let builder = tauri::updater::builder(app_handle)
        .header("user-agent", user_agent)?
        .header("x-device-id", machine_id)?;
    match builder.check().await {
        Ok(update) => {
            if update.is_update_available() {
                let version = update.latest_version().to_string();
                let body = update.body().map(|s| s.to_string());
                info!("update available: {}, body: {:?}", version, body);
                let app_state = cloned_app_handle.state::<AppState>();
                app_state.inner().set_update(update);
                return Ok(true);
            }
            Ok(false)
        }
        Err(tauri::updater::Error::UpToDate) => {
            info!("up to date");
            return Ok(false);
        }
        Err(err) => {
            error!("check update failed: {}", err);
            return Err(err.into());
        }
    }
}

pub fn spawn_thread_to_check_update(app_handle: AppHandle) {
    async_runtime::spawn(async move {
        use tokio::time::Duration;

        tokio::time::sleep(Duration::from_secs(10)).await;
        debug!("child thread");

        loop {
          let app_handle = app_handle.clone();
          let test_update = check_update(app_handle).await;
          let waiting_secs = match test_update {
            Ok(true) => {
              break;
            }
            Ok(false) => 60 * 60 * 2,  // up to date, wait 2 hours
            Err(_) => 60 * 30,  // check update failed, wait half an hours
          };
          debug!("waiting {} seconds", waiting_secs);
          tokio::time::sleep(Duration::from_secs(waiting_secs)).await;
        }
    });
}
