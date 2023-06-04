use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PtyResponse {
  pub(crate) id: String,
  pub(crate) data: Vec<u8>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ThemeResponse {
  pub(crate) name: String,
  pub(crate) json_content: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PtyExitMessage {
  pub(crate) id: String,
}

pub(crate) mod push_event {
  pub static PTY_OUTPUT: &str = "pty-output";
  pub static PTY_EXIT: &str = "pty-exit";
}
