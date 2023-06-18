import classes from "./git_status_item.module.css";
import { MdInsertDriveFile } from "react-icons/md";

export interface GitStatusItemIntf {
  status: string;
  path: string;
  filename: string;
}

export interface GitStatusItemProps {
  data: GitStatusItemIntf;
}

export function GitStatusItem(props: GitStatusItemProps) {
  const { data } = props;
  return (
    <div className={`${classes.gitListItem} t1-noselect`} key={data.path}>
      <div className={classes.icon}>
        <MdInsertDriveFile />
      </div>
      <div className={classes.textContent}>
        <p className="t1-ellipsis">
          <span className={classes.filename}>{data.filename}</span>
          <span className={classes.path}>{data.path}</span>
        </p>
      </div>
    </div>
  );
}
