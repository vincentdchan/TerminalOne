import AppleFolderIcon from "./images/mac-folder-6654.svg"
import "./folder_itlg.scss";
import { useMemo } from "react";

export interface FolderItlgProps {
  currentDir: string,
}

export function FolderItlg(props: FolderItlgProps) {
  const { currentDir } = props;

  const folderName = useMemo(() => {
    return currentDir.split("/").pop();
  }, [currentDir]);

  return (
    <div className="gpterm-folder-itlg">
      <div className="preview">
        <img src={AppleFolderIcon} alt="folder" />
      </div>
      <div className="title">
        {folderName}
      </div>
    </div>
  )
}
