import { SessionManager } from "@pkg/models/session_manager";
import { observer } from "mobx-react";
import type { AppTheme } from "@pkg/models/app_theme";
import { TerminalWrapper } from "@pkg/components/terminal_wrapper";
import "./terminal_container.scss";

export interface TerminalsContainerProps {
  sessionManager: SessionManager;
  theme: AppTheme;
}

export const TerminalsContainer = observer((props: TerminalsContainerProps) => {
  const { sessionManager, theme } = props;
  return (
    <div className="gpterm-terms-container">
      {sessionManager.sessions.map((session, index) => {
        const active = sessionManager.activeSessionIndex === index;
        return (
          <TerminalWrapper
            key={`${index}`}
            active={active}
            session={session}
            theme={theme}
          />
        );
      })}
    </div>
  );
});
