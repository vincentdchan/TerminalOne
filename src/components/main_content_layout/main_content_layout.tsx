import { Suspense, lazy } from "react";
import { TerminalsContainer } from "./terminal_container";
import { AppState } from "@pkg/models/app_state";
import { AppTheme } from "@pkg/models/app_theme";
import { observer } from "mobx-react";
import "./main_content_layout.scss";

export interface MainContentLayoutProps {
  appState: AppState;
  theme: AppTheme;
}

const FileExplorer = lazy(() => import("@pkg/components/file_explorer"));
const GiftBox = lazy(() => import("@pkg/components/gift_box"));

export const MainContentLayout = observer((props: MainContentLayoutProps) => {
  const { appState, theme } = props;
  let leftCls = "gpterm-layout-left";

  if (appState.showFileExplorer) {
    leftCls += " expanded";
  }

  let rightCls = "gpterm-layout-right";
  if (appState.showGiftBox) {
    rightCls += " expanded";
  }

  return (
    <div className="gpterm-main-layout">
      <div className={leftCls}>
        {appState.showFileExplorer && (
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
        {appState.showGiftBox && (
          <Suspense>
            <GiftBox />
          </Suspense>
        )}
      </div>
    </div>
  );
});
