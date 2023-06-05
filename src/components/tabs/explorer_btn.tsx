import { useCallback } from "react";
import { MdAccountTree } from "react-icons/md";
import TabBtn from "@pkg/components/tab_btn";
import type { AppState } from "@pkg/models/app_state";
import { useBehaviorSubject } from "@pkg/hooks/observable";

export interface ExplorerBtnProps {
  appState: AppState;
}

export function ExplorerBtn(props: ExplorerBtnProps) {
  const { appState } = props;

  const handleClick = useCallback(() => {
    appState.toggleShowFileExplorer();
  }, [appState]);

  const showFileExplorer = useBehaviorSubject(appState.showFileExplorer$);

  return (
    <TabBtn unactive={!showFileExplorer} onClick={handleClick}>
      <MdAccountTree />
    </TabBtn>
  );
};
