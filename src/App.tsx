// import reactLogo from "./assets/react.svg";
import { useMemo, useEffect } from "react";
import { observer } from "mobx-react";
import { TerminalWrapper } from "@pkg/components/terminal_wrapper";
import { SessionManager } from "@pkg/models/session_manager";
import { Tabs } from "@pkg/components/tabs";
import "./App.scss";

interface TerminalsContainerProps {
  sessionManager: SessionManager;
}

const TerminalsContainer = observer((props: TerminalsContainerProps) => {
  const { sessionManager } = props;
  return (
    <div className="gpterm-terms-container">
      {sessionManager.sessions.map((session, index) => {
        const active = sessionManager.activeSessionIndex === index;
        return (
          <TerminalWrapper key={`${index}`} active={active} session={session} />
        );
      })}
    </div>
  );
});

function App() {
  const sessionManager = useMemo(() => new SessionManager(), []);

  useEffect(() => {
    sessionManager.newTab();
  }, []);

  return (
    <div className="gpterm-app-container">
      <Tabs sessionManager={sessionManager} />
      <TerminalsContainer sessionManager={sessionManager} />
    </div>
  );
}

export default App;
