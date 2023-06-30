use log::{debug, warn};
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CpuMemResult {
    pub cpu_usage: f64,
    pub mem_usage: f64,
}

fn fetch_cpu_mem_by_pid(pid: u32) -> CpuMemResult {
    let output = Command::new("ps")
        .arg("-o")
        .arg("%cpu,%mem")
        .arg("-p")
        .arg(pid.to_string())
        .output();
    debug!("<==== output: {:?}", output);
    if output.is_err() {
        return CpuMemResult::default();
    }
    let output = output.unwrap();
    let output_str = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = output_str.split('\n').collect();

    if lines.len() < 2 {
        return CpuMemResult::default();
    }

    let stat_line = lines[1].trim();

    let mut stats = Vec::<f64>::new();

    for column in stat_line.split(' ') {
        let trimmed = column.trim();
        if trimmed.is_empty() {
            continue;
        }
        let test_stat = trimmed.parse::<f64>();
        if test_stat.is_err() {
            continue;
        }
        stats.push(test_stat.unwrap());
    }

    if stats.len() < 2 {
        return CpuMemResult::default();
    }
    let cpu_usage = stats[0];
    let mem_usage = stats[1];

    CpuMemResult {
        cpu_usage,
        mem_usage,
    }
}

pub(crate) fn fetch_process_statistics_by_pid(pid: u32) -> Option<CpuMemResult> {
    let output = Command::new("pgrep")
        .arg("-P")
        .arg(pid.to_string())
        .output()
        .ok()?;
    let output_str = String::from_utf8_lossy(&output.stdout);

    let output_is_all_whitespace = output_str.trim().is_empty();

    if output_is_all_whitespace {
        return None;
    }

    let test_pid = output_str.trim().parse::<u32>();
    if test_pid.is_err() {
        warn!("parse error: {}", output_str);
        return None;
    }

    let pid = test_pid.unwrap();
    let stat = fetch_cpu_mem_by_pid(pid);

    Some(stat)
}
