import React, { useCallback } from "react";
import { FileItem as FileItemModule } from "@pkg/messages";
import { MdInsertDriveFile, MdFolder, MdStarRate } from "react-icons/md";
import { invoke } from "@tauri-apps/api";
import className from "classnames";
import classes from "./file_item.module.css";

export interface FileItemProps {
  style?: React.CSSProperties;
  star?: boolean;
  item: FileItemModule;
  onStarClick?: React.MouseEventHandler<HTMLDivElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function FileItem(props: FileItemProps) {
  const { item, style, star, onStarClick, onDoubleClick } = props;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    invoke('open_context_menu', {
      req: {
        position: [e.clientX, e.clientY],
        items: [
          {
            key: "go-to",
            title: "Go to",
          },
          {
            key: "open-in-new-tab",
            title: "Open in new tab",
          }
        ]
      }
    })
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
