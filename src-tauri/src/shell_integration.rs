use std::path::{Path, PathBuf};

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
