
use std::path::PathBuf;

pub fn app_data_dir(product_name: &str) -> Option<PathBuf> {
  dirs_next::data_local_dir().map(|dir| dir.join(&product_name))
}

pub fn app_log_dir(product_name: &str) -> Option<PathBuf> {
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
