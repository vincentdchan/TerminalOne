use std::{path::{Path, PathBuf}, io::Write, str::FromStr};

use crate::Result;
use log::info;
use lazy_static::lazy_static;

struct CopyFilesTuple {
    src: &'static str,
    dest: &'static str,
}

lazy_static! {

  static ref SHELL_COPY_FILES: Vec<CopyFilesTuple> = vec![
    CopyFilesTuple {
      src: "t1-rc.zsh",
      dest: ".zshrc",
    },
    CopyFilesTuple {
      src: "t1-profile.zsh",
      dest: ".zprofile",
    },
    CopyFilesTuple {
      src: "t1-env.zsh",
      dest: ".zshenv",
    },
    CopyFilesTuple {
      src: "t1-login.zsh",
      dest: ".zlogin",
    },
  ];

}

fn escape_shell_path(path: &str) -> String {
    path.replace(" ", "\\ ")
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

    for tuple in SHELL_COPY_FILES.iter() {
      let script_path = {
        let mut tmp = app_shell_path.clone();
        tmp.push(tuple.src);
        tmp
      };

      let dest_path = {
        let mut dest_script_path = shell_path.to_path_buf();
        dest_script_path.push(tuple.dest);
        dest_script_path
      };

      info!("Copy from {:?} to {:?}", script_path, dest_path);
      std::fs::copy(script_path, dest_path)?;
    }

    Ok(())
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
      let precommit_dir = {
          let mut tmp = shell_path.clone();
          tmp.push("t1-rc.zsh");
          tmp
      };
      let escaped_path = escape_shell_path(precommit_dir.to_str().unwrap());
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
