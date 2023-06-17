
use std::path::PathBuf;

use tauri::Config;

pub fn app_data_dir(config: &Config) -> Option<PathBuf> {
  let product_name = config.package.product_name.clone().expect("no product name");
  dirs_next::data_local_dir().map(|dir| dir.join(&product_name))
}

pub fn app_log_dir(config: &Config) -> Option<PathBuf> {
  let product_name = config.package.product_name.clone().expect("no product name");

  #[cfg(target_os = "macos")]
  let path = dirs_next::home_dir().map(|dir| {
    dir
      .join("Library/Logs")
      .join(&product_name)
  });

  #[cfg(not(target_os = "macos"))]
  let path =
    dirs_next::config_dir().map(|dir| dir.join(&product_name).join("logs"));

  path
}
