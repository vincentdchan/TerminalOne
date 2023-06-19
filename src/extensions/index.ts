import { ActionMenuItem, Extension } from "@pkg/models/extension";
import { invoke } from "@tauri-apps/api";
import * as fs from "@pkg/utils/fs";
import { isString } from "lodash-es";

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
    testFile: ".git",
    generateActions: async ({ currentDir }) => {
      const result: string = await invoke("spawn_command", {
        command: "git",
        args: ["branch", "--show-current"],
        cwd: currentDir,
      });
      return {
        title: result,
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
          onTrigger: () => generateNpmRelativeItem("yarn"),
        };
      }

      if (resp[1] === 2) {
        return {
          title: "pnpm",
          color: "rgb(231, 169, 59)",
          onTrigger: () => generateNpmRelativeItem("pnpm"),
        };
      }

      return {
        title: "npm",
        color: "rgb(181, 66, 60)",
        onTrigger: () => generateNpmRelativeItem("npm"),
      };
    },
  },
];

function generateNpmRelativeItem(pkg: string): ActionMenuItem[] {
  return [
    {
      key: "install",
      title: `${pkg} install`,
    },
    {
      key: "start",
      title: `${pkg} start`,
    },
  ];
}

export default extensions;
