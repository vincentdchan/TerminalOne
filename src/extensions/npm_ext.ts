import type {
  ActionMenuItemType,
  ExtensionConfig,
} from "@pkg/models/extension";
import * as fs from "@pkg/utils/fs";

async function generateNpmRelativeItem(
  currentDir: string,
  pkg: string
): Promise<ActionMenuItemType[]> {
  const result: ActionMenuItemType[] = [
    {
      key: "install",
      command: `${pkg} install`,
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
      command: `${pkg} run ${script}`,
    });
  });

  return result;
}

const npmExt: ExtensionConfig = {
  name: "npm",
  setup(context) {
    context.onResolve(
      {
        testFile: "package.json",
      },
      async ({ currentDir }) => {
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
      }
    );
    context.onActionTrigger(({ currentDir, data }) =>
      generateNpmRelativeItem(currentDir, data.title)
    );
  },
};

export default npmExt;
