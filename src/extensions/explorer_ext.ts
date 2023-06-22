import type { ExtensionConfig } from "@pkg/models/extension";

function prettyPath(homeDir: string, path: string): string {
  if (path.startsWith(homeDir)) {
    return "~" + path.slice(homeDir.length);
  }

  return path;
}

const explorerExt: ExtensionConfig = {
  name: "explorer",
  setup(context) {
    context.onResolve({}, async ({ homeDir, currentDir }) => {
      // let title: string = currentDir;
      // const lastPart = currentDir.split("/").pop();
      // if (isString(lastPart)) {
      //   title = lastPart;
      // }
      const title = prettyPath(homeDir, currentDir);

      return {
        title,
        color: "rgb(138, 206, 247)",
      };
    });
    context.onActionTrigger(() => {
      return [
        {
          key: "go-up",
          command: "cd ..",
        },
      ];
    });
  },
};

export default explorerExt;
