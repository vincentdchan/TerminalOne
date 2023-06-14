import { Suspense, lazy } from "react";
import { TerminalsContainer } from "./terminal_container";
import { AppState } from "@pkg/models/app_state";
import { AppTheme } from "@pkg/models/app_theme";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import className from "classnames";
import "./main_content_layout.scss";

export interface MainContentLayoutProps {
  appState: AppState;
  theme: AppTheme;
}

const FileExplorer = lazy(() => import("@pkg/components/file_explorer"));
const GiftBox = lazy(() => import("@pkg/components/gift_box"));

export function MainContentLayout(props: MainContentLayoutProps) {
  const { appState, theme } = props;
  const showFileExplorer = useBehaviorSubject(appState.showFileExplorer$);
  const showGiftBox = useBehaviorSubject(appState.showGiftBox$);

  return (
    <div className="t1-main-layout">
      <div
        className={className("t1-layout-left", {
          expanded: showFileExplorer,
        })}
      >
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
      <div
        className={className("t1-layout-right", {
          expanded: showGiftBox,
        })}
      >
        {showGiftBox && (
          <Suspense>
            <GiftBox appState={appState} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
