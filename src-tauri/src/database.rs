use std::path::Path;
use crate::Result;

pub(crate) fn open_database(path: &Path) -> Result<rusqlite::Connection> {
  let database = rusqlite::Connection::open(path)?;

  database.pragma_update(None, "journal_mode", "journal_mode = WAL")?;

  database.execute(
    "CREATE TABLE IF NOT EXISTS global_kv(
      key TEXT PRIMARY KEY,
      value TEXT
    )",
    (),
  )?;

  database.execute(
    "CREATE TABLE IF NOT EXISTS ui_store(
      key TEXT PRIMARY KEY,
      value TEXT
    )",
    (),
  )?;

  // auto increment id
  database.execute(
    "CREATE TABLE IF NOT EXISTS favorite_folders(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )",
    (),
  )?;

  Ok(database)
}
