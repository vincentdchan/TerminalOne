import { TerminalsContainer } from "./terminal_container";
import { AppState } from "@pkg/models/app_state";
import { AppTheme } from "@pkg/models/app_theme";
import { observer } from "mobx-react";
import "./main_content_layout.scss";

export interface MainContentLayoutProps {
  appState: AppState;
  theme: AppTheme;
}

export const MainContentLayout = observer((props: MainContentLayoutProps) => {
  const { appState, theme } = props;
  return (
    <div className="gpterm-main-layout">
      {appState.showFileExplorer && (
        <div className="gpterm-layout-left">
        </div>
      )}
      <TerminalsContainer
        sessionManager={appState.sessionManager}
        theme={theme}
      />
    </div>
  );
});
