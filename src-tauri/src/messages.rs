use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PtyResponse {
  pub id: String,
  pub data: Vec<u8>,
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

pub(crate) mod push_event {
  pub static PTY_OUTPUT: &str = "pty-output";
  pub static PTY_EXIT: &str = "pty-exit";
}
