use log::{debug, warn};
use serde::{Deserialize, Serialize};
use std::process::Command;

const MAX_LEVEL: u32 = 10;

#[derive(Default)]
pub struct StatResultBuilder {
    pub total_children_count: u32,
    pub first_level_children_names: Vec<String>,
    pub cpu_usage: f64,
    pub mem_usage: f64,
}

#[allow(unused)]
impl StatResultBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn cpu_usage(mut self, cpu_usage: f64) -> Self {
        self.cpu_usage = cpu_usage;
        self
    }

    pub fn mem_usage(mut self, mem_usage: f64) -> Self {
        self.mem_usage = mem_usage;
        self
    }

    pub fn build(self) -> StatResult {
        StatResult {
            total_children_count: self.total_children_count,
            first_level_children_names: self.first_level_children_names,
            cpu_usage: self.cpu_usage,
            mem_usage: self.mem_usage,
        }
    }

    fn build_statistics_by_pid(&mut self, pid: u32, level: u32) {
        if level > MAX_LEVEL {
            return;
        }

        let output = Command::new("pgrep")
            .arg("-P")
            .arg(pid.to_string())
            .arg("-l")
            .output()
            .ok();
        if output.is_none() {
            return;
        }
        let output = output.unwrap();
        let output_str = String::from_utf8_lossy(&output.stdout);

        let output_is_all_whitespace = output_str.trim().is_empty();

        if output_is_all_whitespace {
            return;
        }

        let lines = output_str.split("\n");

        for line in lines {
            let columns = line.split(" ").collect::<Vec<&str>>();
            if columns.len() < 2 {
                continue;
            }
            let test_pid = columns[0].trim().parse::<u32>();
            if test_pid.is_err() {
                warn!("parse error: {}", columns[0]);
                continue;
            }
            let process_name = columns[1].trim();

            if level == 1 {
                self.first_level_children_names
                    .push(process_name.to_string());
            }

            let pid = test_pid.unwrap();

            let stat = fetch_cpu_mem_by_pid(pid);

            self.total_children_count += 1;
            self.cpu_usage += stat.cpu_usage;
            self.mem_usage += stat.mem_usage;

            self.build_statistics_by_pid(pid, level + 1);
        }
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StatResult {
    pub total_children_count: u32,
    pub first_level_children_names: Vec<String>,
    pub cpu_usage: f64,
    pub mem_usage: f64,
}

#[derive(Default, Debug, Clone, Copy)]
struct CpuMemResult {
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

pub(crate) fn fetch_process_statistics_by_pid(pid: u32) -> StatResult {
    let mut builder = StatResultBuilder::new();

    builder.build_statistics_by_pid(pid, 1);

    // let output = Command::new("pgrep")
    //     .arg("-P")
    //     .arg(pid.to_string())
    //     .output()
    //     .ok()?;
    // let output_str = String::from_utf8_lossy(&output.stdout);

    // let output_is_all_whitespace = output_str.trim().is_empty();

    // if output_is_all_whitespace {
    //     return None;
    // }

    // let test_pid = output_str.trim().parse::<u32>();
    // if test_pid.is_err() {
    //     warn!("parse error: {}", output_str);
    //     return None;
    // }

    // let pid = test_pid.unwrap();
    // let stat = fetch_cpu_mem_by_pid(pid);

    builder.build()
}
