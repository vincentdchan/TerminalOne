import { AppState } from "@pkg/models/app_state";
import { escapeShellPath } from "@pkg/utils/shell";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isString } from "lodash-es";
import { FileItem, LsFileResponse } from "@pkg/messages";
import AutoSizer, { type Size } from "react-virtualized-auto-sizer";
import { MdInsertDriveFile, MdFolder, MdKeyboardArrowUp } from "react-icons/md";
import {
  FixedSizeList as List,
  type ListChildComponentProps,
} from "react-window";
import { useObservable } from "@pkg/hooks/observable";
import { take } from "rxjs";
import * as fs from "@pkg/utils/fs";
import "./file_explorer.scss";

function EmptyPlaceholder() {
  return <div className="t1-file-explorer-empty">Not directory found</div>;
}

export interface FileExplorerProps {
  appState: AppState;
}

export function FileExplorer(props: FileExplorerProps) {
  const { appState } = props;

  const currentDir = useObservable(appState.currentDir$, undefined);

  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    const fetchDir = async () => {
      if (!isString(currentDir)) {
        setFiles([]);
        return;
      }

      const data: LsFileResponse = await fs.ls(currentDir);
      setFiles(
        data.content.sort((a, b) => {
          const aFtOrder = a.isDir ? 0 : 1;
          const bFtOrder = b.isDir ? 0 : 1;
          const cmp = aFtOrder - bFtOrder;
          if (cmp !== 0) {
            return cmp;
          }
          return a.filename.localeCompare(b.filename);
        })
      );
    };

    fetchDir();
  }, [currentDir]);

  const Row = (props: ListChildComponentProps<any>) => {
    const { index, style } = props;
    const item = files[index];

    const handleDblClick = useCallback(() => {
      const { sessionManager } = appState;
      let path = escapeShellPath(item.path);
      if (item.isDir) {
        sessionManager.executeCommand(`cd ${path}\r`);
      } else {
        sessionManager.executeCommand(`"${path}"`);
      }
    }, [item]);

    return (
      <div
        className="t1-file-item t1-noselect"
        style={style}
        onDoubleClick={handleDblClick}
      >
        <div className="icon">
          {item.isDir ? <MdFolder /> : <MdInsertDriveFile />}
        </div>
        <div className="filename">
          <div className="inner">{item.filename}</div>
        </div>
      </div>
    );
  };

  const currentFolderName = useMemo(() => {
    return currentDir ? currentDir.split("/").pop() : "GPTerminal";
  }, [currentDir]);

  const handleGoUp = useCallback(() => {
    const { sessionManager } = appState;
    sessionManager.executeCommand("cd ..\r");
  }, []);

  return (
    <div className="t1-file-explorer">
      <div className="header">
        <div className="main">{currentFolderName}</div>
        <div className="right">
          <button onClick={handleGoUp}>
            <MdKeyboardArrowUp />
          </button>
        </div>
      </div>
      <div className="content">
        {currentDir ? (
          <AutoSizer>
            {({ width, height }: Size) => (
              <List
                width={width}
                height={height}
                itemCount={files.length}
                itemSize={28}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        ) : (
          <EmptyPlaceholder />
        )}
      </div>
    </div>
  );
}
