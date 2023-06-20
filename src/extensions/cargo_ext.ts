import { Extension } from "@pkg/models/extension";

const cargoExt: Extension = {
  name: "cargo",
  testFile: "Cargo.toml",
  generateActions: () => {
    return {
      title: "cargo",
      color: "rgb(221, 85, 39)",
      onTrigger: () => {
        return [
          {
            key: "cargo-run",
            command: "cargo run",
          },
          {
            key: "cargo-build",
            command: "cargo build",
          },
          {
            key: "cargo-build-release",
            command: "cargo build --release",
          },
          {
            key: "cargo-test",
            command: "cargo test",
          },
          {
            key: "cargo-bench",
            command: "cargo bench",
          },
          {
            key: "cargo-doc",
            command: "cargo doc",
          },
          {
            key: "cargo-publish",
            command: "cargo publish",
          },
        ];
      },
    };
  },
};

export default cargoExt;
