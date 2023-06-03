use serde::Serialize;

use crate::Result;
use std::{path::{Path, PathBuf}, ops::Index};

#[derive(Clone, Serialize)]
pub(crate) struct ThemeItem {
    pub name: String,
    pub path: PathBuf,
    pub toml_file_path: Option<PathBuf>,
}

impl ThemeItem {
    pub(crate) fn load_from_file(path: &Path) -> Result<Option<ThemeItem>> {
        let dir_name = path.file_name().unwrap().to_str().unwrap();
        for entry in path.read_dir()? {
            let entry = entry?;
            // check the suffix of entry is ends with .terminal
            let child_path = entry.path();
            if child_path.is_file() {
                let child_path_str = child_path.display().to_string();
                if child_path_str.ends_with(".toml") {
                    return Ok(Some(ThemeItem {
                        name: dir_name.to_string(),
                        path: path.to_path_buf(),
                        toml_file_path: Some(child_path),
                    }));
                }
            }
        }

        return Ok(None);
    }
}

pub(crate) struct ThemeContext {
    candidates: Vec<ThemeItem>,
}

impl ThemeContext {
    pub(crate) fn new() -> ThemeContext {
        ThemeContext {
            candidates: Vec::new(),
        }
    }

    pub(crate) fn add(&mut self, item: ThemeItem) {
        self.candidates.push(item);
    }

    #[inline]
    pub(crate) fn is_empty(&self) -> bool {
        self.candidates.is_empty()
    }

}

impl Index<usize> for ThemeContext {
    type Output = ThemeItem;

    fn index(&self, index: usize) -> &ThemeItem {
        &self.candidates[index]
    }
}
