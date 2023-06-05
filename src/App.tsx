// import reactLogo from "./assets/react.svg";
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AppState } from "@pkg/models/app_state";
import { Tabs } from "@pkg/components/tabs";
import { invoke } from "@tauri-apps/api";
import { isString } from "lodash-es";
import { objectToCamlCaseDeep } from "@pkg/utils/objects";
import type { AppTheme } from "@pkg/models/app_theme";
import type { ThemeResponse } from "@pkg/messages";
import { useTabSwitcher } from "@pkg/hooks/tab_switcher";
import { usePtyExit } from "@pkg/hooks/pty_exit";
import { MainContentLayout } from "@pkg/components/main_content_layout";
import { exit } from '@tauri-apps/api/process';
import "./App.scss";

function App() {
  const [theme, setTheme] = useState<AppTheme | null>(null);
  const appState = useMemo(() => new AppState(), []);

  const loadTheme = useCallback(async () => {
    const themeResp: ThemeResponse = await invoke("get_a_theme");
    if (isString(themeResp.jsonContent)) {
      let themeContent = JSON.parse(themeResp.jsonContent) as AppTheme;
      themeContent = objectToCamlCaseDeep(themeContent);
      console.log("theme:", themeContent);
      setTheme(themeContent);
    }
  }, [setTheme]);

  const handlePtyExit = useCallback(async (id: string) => {
    const { sessionManager } = appState;
    sessionManager.removeTabById(id);
    if (sessionManager.sessions.length === 0) {
      await exit(0);
    }
  }, [appState]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    appState.sessionManager.newTab();
  }, [appState]);

  usePtyExit(handlePtyExit);
  useTabSwitcher(appState.sessionManager);

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
          <Tabs appState={appState} />
          <MainContentLayout appState={appState} theme={theme} />
        </>
      )}
    </div>
  );
}

export default App;
