use log::{debug, error, info};
use sysinfo::{System, SystemExt};
use serde::{Deserialize, Serialize};
use reqwest::Client;

#[derive(Debug, Serialize, Deserialize)]
struct Version {
  #[serde(alias = "Name")]
  name: String,
  #[serde(alias = "Notes")]
  notes: Option<String>,
  #[serde(alias = "Release Date")]
  release_date: String,
  #[serde(alias = "Released")]
  released: Option<bool>,
  #[serde(alias = "Platform")]
  platform: String,
  #[serde(alias = "Arch")]
  arch: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct VersionResponse {
  pub versions: Vec<Version>,
}

fn build_http_client(platform: &str, arch: &str, os_version: &str) -> Result<Client, Box<dyn std::error::Error>> {
  let version = env!("CARGO_PKG_VERSION");

  let user_agent = format!("TerminalOne/{} ({}; {}; {})", version, platform, arch, os_version);

  let client = reqwest::Client::builder()
    .timeout(std::time::Duration::from_secs(20))
    .user_agent(user_agent)
    .build()?;

  Ok(client)
}

pub async fn check_update() -> Result<(), Box<dyn std::error::Error>> {
  let machine_id = {
    let machine_id_opt = machine_uid::get();
    if machine_id_opt.is_err() {
      error!("can not get machine id");
      return Ok(());
    }
    machine_id_opt.unwrap()
  };

  info!("Device ID: {:?}", machine_id);

  let mut sys = System::new_all();
  sys.refresh_all();

  let platform = {
    let os_name = sys.name();
    if os_name.is_none() {
      error!("can not get sys name");
      return Ok(());
    }
    os_name.unwrap().to_lowercase()
  };

  let os_version = match sys.os_version() {
    Some(s) => s,
    None => "".to_string(),
  };

  let arch = std::env::consts::ARCH;

  let mut url = "https://api.terminalone.app/Prod/app-versions?".to_string();

  url += &format!("platform={}&", platform);
  url += &format!("arch={}", arch);

  for _ in 0..5 {
    debug!(">>> get update url: {}", &url);

    let client = build_http_client(&platform, &arch, &os_version)?;

    let resp = client
      .get(&url)
      .header("X-DEVICE-ID", machine_id.clone())
      .send().await;

    if let Err(e) = resp {

      error!("get update info failed: {}", e);

      use tokio::time::Duration;
      tokio::time::sleep(Duration::from_secs(10)).await;

      continue;
    }

    let resp = resp.unwrap();

    let versions_data = resp.json::<VersionResponse>().await?;

    debug!("{:#?}", versions_data);
    break;
  }

  Ok(())
}