use serde::{Serialize, Deserialize};
use std::path::{PathBuf, Path};
use log::error;

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub struct Settings {
  #[serde(default)]
  pub terminal: TerminalSettings,
  #[serde(default)]
  pub app: AppSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontSize(pub u32);

impl Default for FontSize {
  fn default() -> Self {
    FontSize(15)
  } 
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scrollback(pub u32);

impl Default for Scrollback {
  fn default() -> Self {
    Scrollback(1000)
  } 
}


#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub struct TerminalSettings {
  #[serde(default)]
  pub font_size: FontSize,
  #[serde(default)]
  pub scrollback: Scrollback,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoUpdate(pub bool);

impl Default for AutoUpdate {
  fn default() -> Self {
    AutoUpdate(true)
  } 
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub struct AppSettings {
  #[serde(default)]
  pub auto_update: AutoUpdate,
}

pub(crate) fn read_init_settings(app_dir: &Path) -> Settings {
  let user_path = PathBuf::from(app_dir).join("User");
  let _ = std::fs::create_dir(&user_path);
  let settings_path = user_path.clone().join("settings.toml");

  let test_read = std::fs::read_to_string(&settings_path);
  if test_read.is_err() {
    return Settings::default();
  }

  let file_content = test_read.unwrap();
  // parse to toml

  let test_parse_settings = toml::from_str(&file_content);

  match test_parse_settings {
    Ok(settings) => settings,
    Err(err) => {
      error!("Error parsing settings: {:?}", err);
      Settings::default()
    }
  }
}
