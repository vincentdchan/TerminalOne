import { useCallback } from "react";
import { observer } from "mobx-react";
import { MdAccountTree } from "react-icons/md";
import TabBtn from "@pkg/components/tab_btn";
import type { AppState } from "@pkg/models/app_state";

export interface ExplorerBtnProps {
  appState: AppState;
}

export const ExplorerBtn = observer((props: ExplorerBtnProps) => {
  const { appState } = props;

  const handleClick = useCallback(() => {
    appState.toggleShowFileExplorer();
  }, [appState]);

  return (
    <TabBtn unactive={!appState.showFileExplorer} onClick={handleClick}>
      <MdAccountTree />
    </TabBtn>
  );
});
