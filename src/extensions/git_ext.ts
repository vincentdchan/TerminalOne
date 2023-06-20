import { Extension } from "@pkg/models/extension";
import { invoke } from "@tauri-apps/api";
import type { SpawnResult } from "@pkg/messages";

const gitExt: Extension = {
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
            command: "git commit",
          },
          {
            key: "git-commit-a",
            command: "git commit -a",
          },
          {
            type: "divider",
          },
          {
            key: "git-pull",
            command: "git pull",
          },
          {
            key: "git-push",
            command: "git push",
          },
        ];
      },
    };
  },
};

export default gitExt;
