use std::backtrace;

use log::error;
use notify_debouncer_mini::notify;

#[derive(Debug)]
pub struct SQLiteErrorWrapper {
  pub content: rusqlite::Error,
  pub backtrace: backtrace::Backtrace,
}

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
  NotifyError(#[from] notify::Error),
  #[error(transparent)]
  ConvertPath(#[from] core::convert::Infallible),
  #[error(transparent)]
  TauriUpdateError(#[from] tauri::updater::Error),
  #[error("io error: {}, backtrace: {:?}", .0.content, .0.backtrace)]
  SQLiteError(Box<SQLiteErrorWrapper>),
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

impl From<rusqlite::Error> for Error {
  fn from(err: rusqlite::Error) -> Self {
    let result = SQLiteErrorWrapper {
      content: err,
      backtrace: backtrace::Backtrace::capture(),
    };
    error!("sqlite error: {:?}", result);
    Self::SQLiteError(Box::new(result))
  }
}
