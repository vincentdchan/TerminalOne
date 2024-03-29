use crate::settings::Settings;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct InitMessage {
    pub home_dir: String,
    pub force_onboarding: bool,
    pub ui_stores: serde_json::Value,
    pub settings: Settings,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PtyResponse {
    pub id: String,
    pub data: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ThemeResponse {
    pub name: String,
    pub json_content: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PtyExitMessage {
    pub id: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FileItem {
    pub filename: String,
    pub path: String,
    pub is_dir: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FsLsResponse {
    pub content: Vec<FileItem>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FsStatResponse {
    pub modified_time: u64,
    pub accessed_time: u64,
    pub created_time: u64,
}

impl Default for FsLsResponse {
    fn default() -> Self {
        FsLsResponse {
            content: Vec::new(),
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SpawnResult {
    pub output: String,
    pub success: bool,
    pub code: Option<i32>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BatchTestFilesReq {
    pub current_dir: String,
    pub files: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TermOptions {
    pub path: String,
    pub watch_dirs: bool,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BatchTestFilesResp {
    pub files: Vec<i32>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MenuItem {
    pub title: String,
    pub key: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenContextMenuReq {
    pub id: String,
    pub items: Vec<MenuItem>,
    pub position: Vec<f64>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenContextMenuClickedMessage {
    pub id: String,
    pub key: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FsChangedMessage {
    pub id: String,
    pub paths: Vec<String>,
}

pub(crate) mod push_event {
    pub static PTY_OUTPUT: &str = "pty-output";
    pub static PTY_EXIT: &str = "pty-exit";
    pub static FS_CHANGED: &str = "fs-changed";
    pub static CONTEXT_MENU_CLICKED: &str = "context-menu-clicked";
}
