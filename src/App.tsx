// import reactLogo from "./assets/react.svg";
import { useMemo, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { TerminalWrapper } from "@pkg/components/terminal_wrapper";
import { SessionManager } from "@pkg/models/session_manager";
import { Tabs } from "@pkg/components/tabs";
import { invoke } from "@tauri-apps/api";
import { load } from "js-toml";
import type { ThemeResponse } from "@pkg/messages";
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
  const [theme, setTheme] = useState<{} | undefined>(undefined);
  const sessionManager = useMemo(() => new SessionManager(), []);

  const loadTheme = useCallback(async () => {
    const themeResp: ThemeResponse = await invoke("get_a_theme");
    if (themeResp.tomlContent) {
      const theme = load(themeResp.tomlContent);
      console.log("theme:", theme);
      setTheme(theme);
    }
  }, [setTheme]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    sessionManager.newTab();
  }, []);

  return (
    <div className="gpterm-app-container">
      {theme && (
        <>
          <Tabs sessionManager={sessionManager} />
          <TerminalsContainer sessionManager={sessionManager} />
        </>
      )}
    </div>
  );
}

export default App;
