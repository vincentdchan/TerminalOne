use std::{path::{PathBuf, Path}, str::FromStr, io::Write};

use log::{info};
use crate::Result;

const ZSH_SCRIPT_NAME: &str = "t1.zsh";

fn make_precommit_dir(shell_path: &Path) -> Result<String> {
    let mut shell_path_buf = shell_path.to_path_buf();
    shell_path_buf.push(ZSH_SCRIPT_NAME);

    Ok(shell_path_buf.to_str().unwrap().to_string())
}

fn escape_shell_path(path: &str) -> String {
    path.replace(" ", "\\ ")
}

#[tauri::command]
pub fn install_script(app_handle: tauri::AppHandle) -> Result<()> {
  let shell_path = app_handle
        .path_resolver()
        .resolve_resource("shell_integration")
        .expect("no shell integration found");
  info!("begin install script");

  let post_commit_str = {
      let mut result = "\n# Terminal One\nsource ".to_string();
      let precommit_dir = make_precommit_dir(&shell_path)?;
      let escaped_path = escape_shell_path(precommit_dir.as_str());
      result += escaped_path.as_str();
      result += "\n";
      result
  };

  let home_dir = dirs::home_dir().unwrap().to_str().unwrap().to_string();

  let mut path = PathBuf::from_str(&home_dir)?;
  path.push(".zshrc");

  let exist = path.exists();

  // read the content of path as string, if the file does not exist, return ""
  let content = std::fs::read_to_string(&path).unwrap_or("".to_string());

  // check if the precommit_str is already in the content
  let already_exist = content.contains(post_commit_str.as_str());
  if already_exist {
    info!("precommit already exist");
    return Ok(());
  }

  let new_content = content + post_commit_str.as_str();
  if exist {
    let backup_path = path.to_str().unwrap().to_string() + ".bak";
    // move path to backup_path
    std::fs::rename(&path, &backup_path)?;
    info!("backup .zshrc to {}", backup_path);
  }

  // open the file and write the new content with file options
  let mut file = std::fs::OpenOptions::new()
      .write(true)
      .create(true)
      .open(&path)?;
  file.write_all(new_content.as_bytes())?;

  info!("write new content to .zshrc");

  Ok(())
}

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
