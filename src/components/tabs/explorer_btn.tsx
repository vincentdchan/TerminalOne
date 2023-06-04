import { useCallback } from "react"
import { observer } from "mobx-react";
import { MdAccountTree } from "react-icons/md";
import type { AppState } from "@pkg/models/app_state";

export interface ExplorerBtnProps {
  appState: AppState;
}

export const ExplorerBtn = observer((props: ExplorerBtnProps) => {
  const { appState } = props;

  const handleClick = useCallback(() => {
    appState.toggleShowFileExplorer();
  }, [appState]);

  let cls = "";
  if (appState.showFileExplorer) {
    cls += "active";
  }

  return (
    <button className={cls} onClick={handleClick}>
      <MdAccountTree />
    </button>
  );
});
