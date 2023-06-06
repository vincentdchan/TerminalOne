import { SessionManager } from "@pkg/models/session_manager";
import type { AppTheme } from "@pkg/models/app_theme";
import { TerminalWrapper } from "@pkg/components/terminal_wrapper";
import "./terminal_container.scss";
import { useBehaviorSubject } from "@pkg/hooks/observable";

export interface TerminalsContainerProps {
  sessionManager: SessionManager;
  theme: AppTheme;
}

export function TerminalsContainer(props: TerminalsContainerProps) {
  const { sessionManager, theme } = props;
  const sessions = useBehaviorSubject(sessionManager.sessions$);
  const activeSessionIndex = useBehaviorSubject(
    sessionManager.activeSessionIndex$
  );
  return (
    <div className="t1-terms-container">
      {sessions.map((session, index) => {
        const active = activeSessionIndex === index;
        return (
          <TerminalWrapper
            key={session.id}
            active={active}
            session={session}
            theme={theme}
          />
        );
      })}
    </div>
  );
}
