// import reactLogo from "./assets/react.svg";
import { useMemo, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { TerminalWrapper } from "@pkg/components/terminal_wrapper";
import { SessionManager } from "@pkg/models/session_manager";
import { Tabs } from "@pkg/components/tabs";
import { invoke } from "@tauri-apps/api";
import { isString } from "lodash-es";
import type { AppTheme } from "@pkg/models/app_theme";
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
  const [theme, setTheme] = useState<AppTheme | undefined>(undefined);
  const sessionManager = useMemo(() => new SessionManager(), []);

  const loadTheme = useCallback(async () => {
    const themeResp: ThemeResponse = await invoke("get_a_theme");
    if (isString(themeResp.jsonContent)) {
      let themeContent = JSON.parse(themeResp.jsonContent) as AppTheme;
      themeContent = objectToCamlCaseDeep(themeContent);
      console.log("theme:", themeContent);
      setTheme(themeContent);
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

function objectToCamlCaseDeep(obj: any) {
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (typeof value === "object") {
        newObj[newKey] = objectToCamlCaseDeep(value);
      } else {
        newObj[newKey] = value;
      }
    }
  }
  return newObj;
}

export default App;
