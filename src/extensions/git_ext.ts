import { ExtensionConfig } from "@pkg/models/extension";
import { invoke } from "@tauri-apps/api";
import type { SpawnResult } from "@pkg/messages";
import { isString } from "lodash-es";

const gitExt: ExtensionConfig = {
  name: "git",
  setup(context) {
    context.onResolve({}, async ({ currentDir }) => {
      const envs = {
        GIT_OPTIONAL_LOCKS: "0",
      };
      let result: SpawnResult = await invoke("spawn_command", {
        command: "git",
        args: ["branch", "--show-current"],
        envs,
        cwd: currentDir,
      });

      if (!result.success) {
        return;
      }

      const branch = result.output.trim();

      let dirty = false;

      result = await invoke("spawn_command", {
        command: "git",
        args: ["status", "--porcelain", "-uall"],
        cwd: currentDir,
        envs,
      });

      if (result.success) {
        const lines = result.output.split("\n");
        if (lines[0]?.length > 0) {
          dirty = true;
        }
      }

      result = await invoke("spawn_command", {
        command: "git",
        args: ["rev-list", "--left-right", "--count", "HEAD...@{u}"],
        cwd: currentDir,
        envs,
      });

      let upDown = "";

      if (result.success) {
        const testResult = /(\d+)\D+(\d+)/.exec(result.output);
        const group1 = testResult?.[1];
        const group2 = testResult?.[2];
        if (isString(group1) && isString(group2)) {
          try {
            const upCount = parseInt(group1, 10);
            const downCount = parseInt(group2, 10);

            if (upCount > 0 || downCount > 0) {
              // upArrow and downArrow
              upDown = ` ↓${downCount} ↑${upCount} `;
            }
          } catch (err) {
            // ignore, don't care
            // console.error("git error:", err);
          }
        }
      } else {
        // ignore, don't care
        // console.error("git error:", result.output);
      }

      return {
        title: `git:${branch}${dirty ? "*" : ""}${upDown}`,
        color: "rgb(215, 90, 62)",
        watchDir: true,
      };
    });
    context.onToolbarButtonTrigger(() => {
      return [
        {
          key: "git-add",
          command: "git add .",
        },
        {
          type: "divider",
        },
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
    });
  },
};

export default gitExt;
