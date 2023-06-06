import AppleFolderIcon from "./images/mac-folder-6654.svg";
import { useEffect, useMemo, useState } from "react";
import * as fs from "@pkg/utils/fs";
import type { LsStatResponse } from "@pkg/messages";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./folder_itlg.scss";

dayjs.extend(relativeTime);

export interface FolderItlgProps {
  currentDir: string;
}

export function FolderItlg(props: FolderItlgProps) {
  const { currentDir } = props;
  const [stat, setStat] = useState<LsStatResponse | undefined>(undefined);

  const folderName = useMemo(() => {
    return currentDir.split("/").pop();
  }, [currentDir]);

  const fetchStat = async (path: string) => {
    const stat = await fs.stat(path);
    setStat(stat);
  };

  useEffect(() => {
    fetchStat(currentDir);
  }, [currentDir]);

  return (
    <div className="t1-folder-itlg">
      <div className="preview">
        <img src={AppleFolderIcon} alt="folder" />
      </div>
      <div className="title">{folderName}</div>
      {stat && (
        <div>
          <div className="detail">
            Created: {dayjs(stat.createdTime).fromNow()}
          </div>
          <div className="detail">
            Last modified: {dayjs(stat.modifiedTime).fromNow()}
          </div>
          <div className="detail">
            Last accessed: {dayjs(stat.accessedTime).fromNow()}
          </div>
        </div>
      )}
    </div>
  );
}
