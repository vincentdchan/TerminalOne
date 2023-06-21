use polodb_core::Error as DbError;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error(transparent)]
  AnyHowError(#[from] anyhow::Error),
  #[error(transparent)]
  TauriError(#[from] tauri::Error),
  #[error("no themes found")]
  NoThemesFound,
  #[error(transparent)]
  TomlError(#[from] toml::de::Error),
  #[error(transparent)]
  JsonError(#[from] serde_json::Error),
  #[error(transparent)]
  SystemTimeError(#[from] std::time::SystemTimeError),
  #[error(transparent)]
  DbError(#[from] DbError),
  #[error(transparent)]
  BsonDeError(#[from] polodb_core::bson::de::Error),
  #[error(transparent)]
  BsonSeError(#[from] polodb_core::bson::ser::Error),
  #[error(transparent)]
  NotifyError(#[from] notify::Error),
}

impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    match self {
      Error::AnyHowError(err) => {
        let str_content = err.to_string();
        serializer.serialize_str(str_content.as_ref())
      }
      _ => {
        serializer.serialize_str(self.to_string().as_ref())
      }
    }
  }
}
