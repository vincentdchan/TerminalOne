import type {
  ActionMenuItemType,
  ExtensionConfig,
} from "@pkg/models/extension";

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
    context.onActionTrigger(({ currentDir }) => {
      const favoriteDirs = context.getFavoriteDirsPath();
      const result: ActionMenuItemType[] = [];

      if (favoriteDirs.includes(currentDir)) {
        result.push({
          key: "remove-from-favorite",
          title: "Remove from Favorites",
          onClick: () => {
            context.addOrRemoveFavoriteDirByPath(currentDir);
          },
        });
      } else {
        result.push({
          key: "add-to-favorite",
          title: "Add to Favorites",
          onClick: () => {
            context.addOrRemoveFavoriteDirByPath(currentDir);
          },
        });
      }

      if (favoriteDirs.length !== 0) {
        result.push({
          type: "divider",
        });
        for (const dir of favoriteDirs) {
          const basename = dir.split("/").pop();
          result.push({
            key: `goto:${dir}`,
            title: basename,
            command: `cd ${dir}`,
          });
        }
      }

      result.push({
        type: "divider",
      });

      result.push({
        key: "go-up",
        title: "Go to parent directory",
        command: "cd ..",
      });
      return result;
    });
  },
};

export default explorerExt;
