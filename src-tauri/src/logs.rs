use std::path::Path;
use log4rs::append::console::ConsoleAppender;
use log4rs::append::rolling_file::policy::compound::roll::delete::DeleteRoller;
use log4rs::append::rolling_file::policy::compound::trigger::size::SizeTrigger;
use log4rs::append::rolling_file::policy::compound::CompoundPolicy;
use log4rs::append::rolling_file::RollingFileAppender;
use log4rs::config::{Appender, Config, Root};
use log4rs::encode::pattern::PatternEncoder;

pub(crate) fn init_logs(app_log_dir: &Path) {
    if cfg!(dev) {
        let stdout = ConsoleAppender::builder()
            .encoder(Box::new(PatternEncoder::new(
                "{d(%Y-%m-%d %H:%M:%S %Z)} {h({l})} {I} {m}{n}",
            )))
            .build();
        let config = Config::builder()
            .appender(Appender::builder().build("stdout", Box::new(stdout)))
            .build(
                Root::builder()
                    .appender("stdout")
                    .build(log::LevelFilter::max()),
            )
            .unwrap();

        let _handle = log4rs::init_config(config).unwrap();
    } else {
        let _ = std::fs::create_dir(&app_log_dir);

        let file_path = app_log_dir.join("TerminalOne.log");
        let file = RollingFileAppender::builder()
            .encoder(Box::new(PatternEncoder::new(
                "{d(%Y-%m-%d %H:%M:%S %Z)} {h({l})} {I} {m}{n}",
            )))
            .build(
                file_path,
                Box::new(CompoundPolicy::new(
                    Box::new(SizeTrigger::new(10_000_000)),
                    Box::new(DeleteRoller::new()),
                )),
            )
            .expect("build rolling file appender failed");
        let config = Config::builder()
            .appender(Appender::builder().build("file", Box::new(file)))
            .build(
                Root::builder()
                    .appender("file")
                    .build(log::LevelFilter::Info),
            )
            .unwrap();

        let _handle = log4rs::init_config(config).unwrap();
    }
}
