import { AppState } from "@pkg/models/app_state";
import { escapeShellPath } from "@pkg/utils/shell";
import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { invoke } from "@tauri-apps/api";
import { isString } from "lodash-es";
import { FileItem, LsFileResponse } from "@pkg/messages";
import AutoSizer, { type Size } from "react-virtualized-auto-sizer";
import { MdInsertDriveFile, MdFolder } from "react-icons/md";
import {
  FixedSizeList as List,
  type ListChildComponentProps,
} from "react-window";
import "./file_explorer.scss";

function EmptyPlaceholder() {
  return <div className="gpterm-file-explorer-empty">Not directory found</div>;
}

export interface FileExplorerProps {
  appState: AppState;
}

const FILE_PREFIX = "file://";

export const FileExplorer = observer((props: FileExplorerProps) => {
  const { appState } = props;

  const currentDir = appState.currentDir;

  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    const fetchDir = async () => {
      if (!isString(currentDir)) {
        setFiles([]);
        return;
      }

      let path = currentDir;
      if (path.startsWith(FILE_PREFIX)) {
        path = path.slice(FILE_PREFIX.length);
      }

      const data: LsFileResponse = await invoke("fs_ls", {
        path,
      });
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
      const { activeSection } = appState.sessionManager;
      if (!activeSection) {
        return;
      }
      let path = escapeShellPath(item.path);
      if (item.isDir) {
        activeSection.shellInput$.next(`cd ${path}\r`);
      } else {
        activeSection.shellInput$.next(`"${path}"`);
      }
    }, [item]);

    return (
      <div
        className="gpterm-file-item gpterm-noselect"
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

  return (
    <div className="gpterm-file-explorer">
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
  );
});
