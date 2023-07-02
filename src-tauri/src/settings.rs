use serde::{Serialize, Deserialize};

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub struct Settings {
  #[serde(default)]
  pub terminal: TerminalSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub struct TerminalSettings {
  pub font_size: u32,
}

impl Default for TerminalSettings {
  fn default() -> Self {
    TerminalSettings {
      font_size: 15,
    }
  }
}
