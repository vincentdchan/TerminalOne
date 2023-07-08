use std::{path::{PathBuf, Path}};

use log::{info};
use crate::Result;

const ZSH_SCRIPT_NAME: &str = "t1.zsh";

fn make_precommit_dir(shell_path: &Path) -> Result<String> {
    let mut shell_path_buf = shell_path.to_path_buf();
    shell_path_buf.push(ZSH_SCRIPT_NAME);

    Ok(shell_path_buf.to_str().unwrap().to_string())
}

// fn escape_shell_path(path: &str) -> String {
//     path.replace(" ", "\\ ")
// }

#[cfg(debug_assertions)]
pub fn get_shell_path(app_data_dir: &Path) -> Result<PathBuf> {
  let mut shell_path_buf = app_data_dir.to_path_buf();
  shell_path_buf.push("Shell");
  shell_path_buf.push("zsh_debug");

  Ok(shell_path_buf)
}

#[cfg(not(debug_assertions))]
pub fn get_shell_path(app_data_dir: &Path) -> Result<PathBuf> {
  let mut shell_path_buf = app_data_dir.to_path_buf();
  shell_path_buf.push("Shell");
  shell_path_buf.push("zsh");

  Ok(shell_path_buf)
}

pub fn init_shell_integration(app_handle: &tauri::AppHandle, shell_path: &Path) -> Result<()> {
  info!("Shell path: {:?}", shell_path);

  // mkdir -p shell_path if not exists
  if !shell_path.exists() {
    std::fs::create_dir_all(&shell_path)?;
  }

  let app_shell_path = app_handle
        .path_resolver()
        .resolve_resource("shell_integration")
        .expect("no shell integration found");
  let script_path = make_precommit_dir(&app_shell_path)?;

  let mut dest_script_path = shell_path.to_path_buf();
  dest_script_path.push(".zshrc");

  info!("Copy from {} to {:?}", script_path, dest_script_path);
  std::fs::copy(script_path, dest_script_path)?;

  Ok(())
}
