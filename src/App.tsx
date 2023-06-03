// import reactLogo from "./assets/react.svg";
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { observer } from "mobx-react";
import { TerminalWrapper } from "@pkg/components/terminal_wrapper";
import { SessionManager } from "@pkg/models/session_manager";
import { Tabs } from "@pkg/components/tabs";
import { invoke } from "@tauri-apps/api";
import { isString, isObject } from "lodash-es";
import type { AppTheme } from "@pkg/models/app_theme";
import type { ThemeResponse } from "@pkg/messages";
import "./App.scss";

interface TerminalsContainerProps {
  sessionManager: SessionManager;
  theme: AppTheme;
}

const TerminalsContainer = observer((props: TerminalsContainerProps) => {
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

function App() {
  const [theme, setTheme] = useState<AppTheme | null>(null);
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

  const styles: any = useMemo(() => {
    if (!theme) {
      return {};
    }

    const result: any = {};

    Object.entries(theme.colors).forEach(([key, value]) => {
      if (key === "brights") {
        const brights = value as string[];
        for (let i = 0; i < brights.length; i++) {
          const color = brights[i];
          result[`--gpterm-bright-${i}`] = color;
        }
        return;
      }

      if (isString(value)) {
        result[`--gpterm-${key}`] = value;
      }
    });

    return result;
  }, [theme]);

  return (
    <div className="gpterm-app-container" style={styles}>
      {theme && (
        <>
          <Tabs sessionManager={sessionManager} />
          <TerminalsContainer sessionManager={sessionManager} theme={theme} />
        </>
      )}
    </div>
  );
}

function objectToCamlCaseDeep(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => objectToCamlCaseDeep(item));
  } else if (isObject(obj)) {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as any)[key];
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
  return obj;
}

export default App;
