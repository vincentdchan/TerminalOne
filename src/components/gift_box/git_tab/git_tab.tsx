import { memo, useContext, useEffect, useState } from "react";
import { AppContext } from "@pkg/contexts/app_context";
import { useObservable } from "@pkg/hooks/observable";
import { find, isString } from "lodash-es";
import { invoke } from "@tauri-apps/api";
import * as fs from "@pkg/utils/fs";
import { PrimaryButton } from "@pkg/components/button";
import classes from "./git_tab.module.css";

interface GitStatusItem {
  status: string;
  path: string;
  filename: string;
}

interface GitShowProps {
  gitPath: string;
}

function GitShow(props: GitShowProps) {
  const { gitPath } = props;
  const [lines, setLines] = useState<GitStatusItem[]>([]);

  const fetchGitStatus = async (currentDir: string) => {
    const result: string = await invoke("spawn_command", {
      command: "git",
      args: ["status", "--porcelain", "-uall"],
      cwd: currentDir,
    });

    const lines = result.split("\n");

    const items: GitStatusItem[] = [];

    for (const line of lines) {
      const testResult = /(\S+)\s+(\S+)/.exec(line);
      if (!testResult) {
        continue;
      }
      if (isString(testResult[1]) && isString(testResult[2])) {
        const status = testResult[1];
        const path = testResult[2];

        const filename = path.split("/").pop() ?? path;

        items.push({
          status,
          path,
          filename,
        });
      }
    }

    setLines(items);
  };

  useEffect(() => {
    fetchGitStatus(gitPath);
  }, [gitPath]);

  return (
    <div className={classes.gitShow}>
      <div className={classes.listContainer}>
        {lines.map((line) => {
          return (
            <div
              className={`${classes.gitListItem} t1-noselect`}
              key={line.path}
            >
              <p className="t1-ellipsis">
                <span className={classes.filename}>{line.filename}</span>
                <span className={classes.path}>{line.path}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const GitTab = memo(() => {
  const appState = useContext(AppContext)!;
  const currentDir = useObservable(appState.currentDir$, undefined);
  const [hasGit, setHasGit] = useState(false);

  const fetchDir = async (currentDir: string) => {
    const resp = await fs.ls(currentDir);
    const gitDir = find(resp.content, (file) => file.filename === ".git");
    if (gitDir) {
      setHasGit(true);
    }
  };

  useEffect(() => {
    if (currentDir) {
      fetchDir(currentDir);
    }
  }, [currentDir]);

  return hasGit ? (
    <div className={classes.container}>
      <div className={classes.contentContainer}>
        <GitShow gitPath={currentDir!} />
      </div>
      <textarea></textarea>
      <PrimaryButton>Submit</PrimaryButton>
    </div>
  ) : (
    <div></div>
  );
});
