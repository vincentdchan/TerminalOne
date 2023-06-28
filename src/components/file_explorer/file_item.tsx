import React, { useCallback, useContext } from "react";
import { FileItem as FileItemModule } from "@pkg/messages";
import { MdInsertDriveFile, MdFolder, MdStarRate } from "react-icons/md";
import { invoke } from "@tauri-apps/api";
import className from "classnames";
import classes from "./file_item.module.css";
import { mkMenuId } from "@pkg/utils/id_helper";
import { openContextMenu } from "@pkg/utils/context_menu";
import { AppContext } from "@pkg/contexts/app_context";
import { filter, take } from "rxjs";

export interface FileItemProps {
  style?: React.CSSProperties;
  star?: boolean;
  item: FileItemModule;
  onStarClick?: React.MouseEventHandler<HTMLDivElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function FileItem(props: FileItemProps) {
  const { item, style, star, onStarClick, onDoubleClick } = props;
  const appState = useContext(AppContext)!;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    openContextMenu(
      {
        id: mkMenuId(),
        position: [e.clientX, e.clientY],
        items: [
          {
            key: "go-to",
            title: "Go to",
          },
          {
            key: "open-in-new-tab",
            title: "Open in new tab",
          },
          {
            key: "reveal-in-finder",
            title: "Reveal in finder",
          },
        ],
      },
      (key) => {
        switch (key) {
          case "go-to":
            appState.sessionManager.executeCommand(`cd "${item.path}"\r`);
            break;
          case "open-in-new-tab": {
            const newSession = appState.sessionManager.newTab();
            newSession.uiReady$
              .pipe(
                filter((value) => !!value),
                take(1)
              )
              .subscribe(() => {
                newSession.shellInput$.next(`cd "${item.path}"\r`);
              });
            break;
          }
          case "reveal-in-finder":
            invoke("launch_url", { url: item.path });
            break;
          default: {
          }
        }
      }
    );
  }, []);

  return (
    <div
      className={`${classes.fileItem} t1-noselect`}
      style={style}
      onContextMenu={handleContextMenu}
      onDoubleClick={onDoubleClick}
    >
      <div className={classes.icon}>
        {item.isDir ? <MdFolder /> : <MdInsertDriveFile />}
      </div>
      <div className={classes.filename}>
        <div className="inner t1-ellipsis">{item.filename}</div>
      </div>
      {item.isDir && (
        <div
          className={className(classes.right, {
            star: !!star,
          })}
          onClick={onStarClick}
        >
          <MdStarRate />
        </div>
      )}
    </div>
  );
}
