import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
  useContext,
  useRef,
} from "react";
import { escapeShellPath } from "@pkg/utils/shell";
import { isString } from "lodash-es";
import { FileItem as FileItemModel, LsFileResponse } from "@pkg/messages";
import AutoSizer, { type Size } from "react-virtualized-auto-sizer";
import { MdKeyboardArrowUp } from "react-icons/md";
import {
  FixedSizeList as List,
  type ListChildComponentProps,
} from "react-window";
import { useObservable } from "@pkg/hooks/observable";
import { AppContext } from "@pkg/contexts/app_context";
import { FileItem } from "./file_item";
import { Set as ImmutableSet } from "immutable";
import * as fs from "@pkg/utils/fs";
import "./file_explorer.scss";

function EmptyPlaceholder() {
  return <div className="t1-file-explorer-empty">Not directory found</div>;
}

const ITEM_HEIGHT = 28;

export const FileExplorer = memo(() => {
  const appState = useContext(AppContext)!;
  const currentDir = useObservable(appState.currentDir$, undefined);
  const favoriteDirs = useObservable(appState.favoriteDirs$, []);

  const [files, setFiles] = useState<FileItemModel[]>([]);
  const pathToFileMap = useRef<Map<string, FileItemModel> | null>(null);

  useEffect(() => {
    const fetchDir = async () => {
      if (!isString(currentDir)) {
        setFiles([]);
        return;
      }

      const data: LsFileResponse = await fs.ls(currentDir);

      const newFiles = data.content.sort((a, b) => {
        const aFtOrder = a.isDir ? 0 : 1;
        const bFtOrder = b.isDir ? 0 : 1;
        const cmp = aFtOrder - bFtOrder;
        if (cmp !== 0) {
          return cmp;
        }
        return a.filename.localeCompare(b.filename);
      });

      pathToFileMap.current = new Map();
      newFiles.forEach((item) => {
        pathToFileMap.current!.set(item.path, item);
      });

      setFiles(newFiles);
    };

    fetchDir();
  }, [currentDir]);

  const handleDblClick = (item: FileItemModel) => () => {
    const { sessionManager } = appState;
    let path = escapeShellPath(item.path);
    if (item.isDir) {
      sessionManager.executeCommand(`cd ${path}\r`);
    } else {
      sessionManager.executeCommand(`"${path}"`);
    }
  };

  const handleStarClick = (item: FileItemModel) => () =>
    appState.addOrRemoveFavoriteDir(item);

  const Row = (props: ListChildComponentProps<any>) => {
    const { index, style } = props;
    const item = files[index];

    const isFavorite = appState.favoriteDirsPath$.value.has(item.path);

    return (
      <FileItem
        item={item}
        star={isFavorite}
        style={style}
        onStarClick={handleStarClick(item)}
        onDoubleClick={handleDblClick(item)}
      />
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
      {favoriteDirs.length === 0 ? null : (
        <>
          <div className="header">
            <div className="main t1-noselect">Favorites</div>
          </div>
          <div
            className="favorite-contents"
            style={{
              maxHeight: ITEM_HEIGHT * 4.5,
            }}
          >
            {favoriteDirs.map((item) => {
              return (
                <FileItem
                  star
                  key={item.path}
                  style={{ height: ITEM_HEIGHT }}
                  item={item}
                  onStarClick={handleStarClick(item)}
                  onDoubleClick={handleDblClick(item)}
                />
              );
            })}
          </div>
        </>
      )}
      <div className="header">
        <div className="main t1-noselect">{currentFolderName}</div>
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
                itemSize={ITEM_HEIGHT}
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
});
