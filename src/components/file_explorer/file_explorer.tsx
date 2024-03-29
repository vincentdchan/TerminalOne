import { useEffect, useMemo, useState, memo, useContext, useRef } from "react";
import { escapeShellPath } from "@pkg/utils/shell";
import { isString } from "lodash-es";
import { FileItem as FileItemModel, LsFileResponse } from "@pkg/messages";
import AutoSizer, { type Size } from "react-virtualized-auto-sizer";
import {
  FixedSizeList as List,
  type ListChildComponentProps,
} from "react-window";
import { useObservable } from "@pkg/hooks/observable";
import { AppContext } from "@pkg/contexts/app_context";
import { FileItem } from "./file_item";
import * as fs from "@pkg/utils/fs";
import classNames from "classnames";
import classes from "./file_explorer.module.css";

function EmptyPlaceholder() {
  return <div className={classes.fileExplorerEmpty}>Not directory found</div>;
}

const ITEM_HEIGHT = 28;

export const FileExplorer = memo(() => {
  const appState = useContext(AppContext)!;
  const currentDir = useObservable(appState.currentDir$, undefined);
  const favoriteDirs = useObservable(appState.favoriteDirs$, []);
  const activeSession = useObservable(appState.sessionManager.activeSession$, undefined);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [files, setFiles] = useState<FileItemModel[]>([]);
  const pathToFileMap = useRef<Map<string, FileItemModel> | null>(null);

  useEffect(() => {
    appState.fetchFavoriteDirs();
  }, [appState]);

  useEffect(() => {
    if (!activeSession || !currentDir) {
      return;
    }
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

      const parentPath = currentDir.split("/").slice(0, -1).join("/");

      newFiles.splice(0, 0, {
        filename: "..",
        path: parentPath,
        isDir: true,
      });

      pathToFileMap.current = new Map();
      newFiles.forEach((item) => {
        pathToFileMap.current!.set(item.path, item);
      });

      setFiles(newFiles);
    };
    fetchDir();

    const sub = activeSession.fsChanged$.subscribe((path: string[]) => {
      let isCurrentDir = false;

      for (const p of path) {
        let slices = p.split("/");
        slices.pop();
        const folderName = slices.join("/");
        if (folderName === currentDir) {
          isCurrentDir = true;
          break;
        }
      }
      
      if (isCurrentDir) {
        fetchDir();
      }
    });

    return () => sub.unsubscribe();
  }, [activeSession, currentDir]);

  const handleDblClick = (item: FileItemModel) => () => {
    const { sessionManager } = appState;
    let path = escapeShellPath(item.path);
    if (item.isDir) {
      sessionManager.executeCommand(`cd ${path}\r`);
    } else {
      sessionManager.executeCommand(`"${path}"`);
    }
  };

  const handleStarClick = (item: FileItemModel) => (e: React.MouseEvent) => {
    e.preventDefault();
    appState.addOrRemoveFavoriteDir(item);
  }

  const Row = (props: ListChildComponentProps<any>) => {
    const { index, style } = props;
    const item = files[index];

    const isFavorite = appState.favoriteDirsPath$.value.includes(item.path);

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
    return currentDir ? currentDir.split("/").pop() : "Terminal One";
  }, [currentDir]);

  return (
    <div className={classes.fileExplorer}>
      {favoriteDirs.length === 0 ? null : (
        <>
          <div className={classes.header}>
            <div className="main t1-noselect">Favorites</div>
          </div>
          <div
            className={`${classes.favoriteContents} t1-std-scrollbar`}
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
      <div
        className={classNames(classes.header, {
          "bottom-border": scrollOffset > 0,
        })}
      >
        <div className="main t1-noselect">{currentFolderName}</div>
        {/* <div className="right">
          <IconButton onClick={handleGoUp}>
            <MdKeyboardArrowUp />
          </IconButton>
        </div> */}
      </div>
      <div className={classes.content}>
        {currentDir ? (
          <AutoSizer>
            {({ width, height }: Size) => (
              <List
                className="t1-std-scrollbar"
                width={width}
                height={height}
                itemCount={files.length}
                itemSize={ITEM_HEIGHT}
                onScroll={(props) => {
                  if (props.scrollOffset === scrollOffset) {
                    return;
                  }
                  setScrollOffset(props.scrollOffset);
                }}
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
