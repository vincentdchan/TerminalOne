import React from "react";
import { FileItem as FileItemModule } from "@pkg/messages";
import { MdInsertDriveFile, MdFolder, MdStarRate } from "react-icons/md";
import className from "classnames";
import "./file_item.scss";

export interface FileItemProps {
  style?: React.CSSProperties;
  star?: boolean;
  item: FileItemModule;
  onStarClick?: React.MouseEventHandler<HTMLDivElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function FileItem(props: FileItemProps) {
  const { item, style, star, onStarClick, onDoubleClick } = props;

  return (
    <div
      className="t1-file-item t1-noselect"
      style={style}
      onDoubleClick={onDoubleClick}
    >
      <div className="icon">
        {item.isDir ? <MdFolder /> : <MdInsertDriveFile />}
      </div>
      <div className="filename">
        <div className="inner">{item.filename}</div>
      </div>
      {item.isDir && (
        <div
          className={className("right", {
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
