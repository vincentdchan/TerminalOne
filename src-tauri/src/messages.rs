
#[derive(Clone, serde::Serialize)]
pub(crate) struct PtyResponse {
  pub(crate) id: String,
  pub(crate) data: Vec<u8>,
}
