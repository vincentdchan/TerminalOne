import { ExtensionConfig } from "@pkg/models/extension";

const cargoExt: ExtensionConfig = {
  name: "cargo",
  setup(context) {
    context.onResolve(
      {
        testFile: "Cargo.toml",
      },
      () => {
        return {
          title: "cargo",
          color: "rgb(221, 85, 39)",
        };
      }
    );
    context.onToolbarButtonTrigger(() => {
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
    });
  },
};

export default cargoExt;
