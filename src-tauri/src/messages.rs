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
  pub(crate) toml_content: Option<String>,
}
