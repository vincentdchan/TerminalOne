import { Suspense, lazy } from "react";
import { TerminalsContainer } from "./terminal_container";
import { AppState } from "@pkg/models/app_state";
import { AppTheme } from "@pkg/models/app_theme";
import "./main_content_layout.scss";
import { useBehaviorSubject } from "@pkg/hooks/observable";

export interface MainContentLayoutProps {
  appState: AppState;
  theme: AppTheme;
}

const FileExplorer = lazy(() => import("@pkg/components/file_explorer"));
const GiftBox = lazy(() => import("@pkg/components/gift_box"));

export function MainContentLayout(props: MainContentLayoutProps) {
  const { appState, theme } = props;
  let leftCls = "t1-layout-left";

  const showFileExplorer = useBehaviorSubject(appState.showFileExplorer$);
  const showGiftBox = useBehaviorSubject(appState.showGiftBox$);

  if (showFileExplorer) {
    leftCls += " expanded";
  }

  let rightCls = "t1-layout-right";
  if (showGiftBox) {
    rightCls += " expanded";
  }

  return (
    <div className="t1-main-layout">
      <div className={leftCls}>
        {showFileExplorer && (
          <Suspense>
            <FileExplorer appState={appState} />
          </Suspense>
        )}
      </div>
      <TerminalsContainer
        sessionManager={appState.sessionManager}
        theme={theme}
      />
      <div className={rightCls}>
        {showGiftBox && (
          <Suspense>
            <GiftBox appState={appState} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
