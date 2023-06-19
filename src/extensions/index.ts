import { ActionMenuItemType, Extension } from "@pkg/models/extension";
import { invoke } from "@tauri-apps/api";
import * as fs from "@pkg/utils/fs";
import { isString } from "lodash-es";
import type { SpawnResult } from "@pkg/messages";

const extensions: Extension[] = [
  {
    name: "explorer",
    generateActions: async ({ currentDir }) => {
      let title: string = currentDir;
      const lastPart = currentDir.split("/").pop();
      if (isString(lastPart)) {
        title = lastPart;
      }

      return {
        title,
        color: "rgb(138, 206, 247)",
      };
    },
  },
  {
    name: "git",
    generateActions: async ({ currentDir }) => {
      const result: SpawnResult = await invoke("spawn_command", {
        command: "git",
        args: ["branch", "--show-current"],
        cwd: currentDir,
      });

      if (!result.success) {
        return;
      }

      return {
        title: `git:${result.output}`,
        color: "rgb(215, 90, 62)",
        onTrigger: () => {
          return [
            {
              key: "git-commit",
              title: "git commit",
            },
            {
              key: "git-commit-a",
              title: "git commit -a",
            },
            {
              type: "divider",
            },
            {
              key: "git-pull",
              title: "git pull",
            },
            {
              key: "git-push",
              title: "git push",
            },
          ];
        },
      };
    },
  },
  {
    name: "npm",
    testFile: "package.json",
    generateActions: async ({ currentDir }) => {
      const resp = await fs.batchTestFiles(currentDir, [
        "yarn.lock",
        "pnpm-lock.yaml",
      ]);

      if (resp[0] === 2) {
        return {
          title: "yarn",
          color: "rgb(74, 140, 183)",
          onTrigger: () => generateNpmRelativeItem(currentDir, "yarn"),
        };
      }

      if (resp[1] === 2) {
        return {
          title: "pnpm",
          color: "rgb(231, 169, 59)",
          onTrigger: () => generateNpmRelativeItem(currentDir, "pnpm"),
        };
      }

      return {
        title: "npm",
        color: "rgb(181, 66, 60)",
        onTrigger: () => generateNpmRelativeItem(currentDir, "npm"),
      };
    },
  },
  {
    name: "flutter",
    testFile: "pubspec.yaml",
    generateActions: () => {
      return {
        title: "flutter",
        color: "rgb(117, 191, 235)",
        onTrigger: () => {
          return [
            {
              key: "flutter-run",
              title: "flutter run",
            },
            {
              key: "flutter-test",
              title: "flutter test",
            },
            {
              key: "flutter-pub-get",
              title: "flutter pub get",
            },
            {
              key: "flutter-build",
              title: "flutter build",
            },
          ]
        },
      }
    },
  },
  {
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
              title: "cargo run",
            },
            {
              key: "cargo-build",
              title: "cargo build",
            },
            {
              key: "cargo-build-release",
              title: "cargo build --release",
            },
            {
              key: "cargo-test",
              title: "cargo test",
            },
            {
              key: "cargo-bench",
              title: "cargo bench",
            },
            {
              key: "cargo-doc",
              title: "cargo doc",
            },
            {
              key: "cargo-publish",
              title: "cargo publish",
            },
          ]
        },
      }
    },
  },
];

async function generateNpmRelativeItem(currentDir: string, pkg: string): Promise<ActionMenuItemType[]> {
  const result: ActionMenuItemType[] = [
    {
      key: "install",
      title: `${pkg} install`,
    },
  ];

  const fileToRead = currentDir + "/package.json";
  const str = await fs.readAll(fileToRead);

  const data = JSON.parse(str);
  const scripts = Object.keys(data.scripts || {});

  scripts.forEach((script, index) => {
    if (index === 0) {
      result.push({
        type: "divider",
      });
    }

    result.push({
      key: script,
      title: `${pkg} run ${script}`,
    });
  });

  return result;
}

export default extensions;
