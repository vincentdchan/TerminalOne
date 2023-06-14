import { useContext, memo } from "react";
import { TerminalWrapper } from "@pkg/components/terminal_wrapper";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import { AppContext } from "@pkg/contexts/app_context";
import { ThemeContext } from "@pkg/contexts/app_theme";
import "./terminal_container.scss";

export const TerminalsContainer = memo(() => {
  const appState = useContext(AppContext)!;
  const theme = useContext(ThemeContext)!;

  const { sessionManager } = appState;
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
});
