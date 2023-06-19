import { Extension } from "@pkg/models/extension";
import * as fs from "@pkg/utils/fs";

const extensions: Extension[] = [
  {
    name: "git",
    testFile: ".git",
    generateActions: () => {
      return {
        title: "master",
        color: "rgb(215, 90, 62)",
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
        };
      }

      if (resp[1] === 2) {
        return {
          title: "pnpm",
          color: "rgb(231, 169, 59)",
        };
      }

      return {
        title: "npm",
        color: "rgb(181, 66, 60)",
      };
    },
  },
];

export default extensions;
