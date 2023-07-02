import { useCallback, forwardRef, ForwardedRef } from "react";
import { MdAccountTree } from "react-icons/md";
import TabBtn from "@pkg/components/tab_btn";
import type { AppState } from "@pkg/models/app_state";
import { useBehaviorSubject } from "@pkg/hooks/observable";

export interface ExplorerBtnProps {
  appState: AppState;
}

export const ExplorerBtn = forwardRef(
  (props: ExplorerBtnProps, ref: ForwardedRef<any>) => {
    const { appState } = props;

    const handleClick = useCallback(() => {
      appState.toggleShowFileExplorer();
      appState.sessionManager.focusActiveSession();
    }, [appState]);

    const showFileExplorer = useBehaviorSubject(appState.showFileExplorer$);

    return (
      <TabBtn
        ref={ref as any}
        unactive={!showFileExplorer}
        onClick={handleClick}
      >
        <MdAccountTree />
      </TabBtn>
    );
  }
);
