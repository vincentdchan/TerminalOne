import AppleFolderIcon from "./images/mac-folder-6654.svg";
import { useEffect, useMemo, useState, memo } from "react";
import * as fs from "@pkg/utils/fs";
import type { LsStatResponse } from "@pkg/messages";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import classes from "./folder_itlg.module.css";

dayjs.extend(relativeTime);

interface GridRowProps {
  name: string;
  value: string;
}

const GridRow = memo((props: GridRowProps) => {
  const { name, value } = props;
  return (
    <div className={classes.row}>
      <div className={classes.name}>{name}</div>
      <div className={classes.value}>
        <div className="inner t1-ellipsis">{value}</div>
      </div>
    </div>
  );
});

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
    <div className={classes.folderItlg}>
      <div className={classes.preview}>
        <img src={AppleFolderIcon} alt="folder" />
      </div>
      <div className={classes.title}>{folderName}</div>
      {stat && (
        <div className={classes.folderInfoGrid}>
          <GridRow name="Created" value={dayjs(stat.createdTime).fromNow()} />
          <GridRow name="Modified" value={dayjs(stat.modifiedTime).fromNow()} />
          <GridRow name="Accessed" value={dayjs(stat.accessedTime).fromNow()} />
        </div>
      )}
    </div>
  );
}
