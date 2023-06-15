// import reactLogo from "./assets/react.svg";
import { useMemo, useState, useEffect, useCallback } from "react";
import { AppState } from "@pkg/models/app_state";
import { Tabs } from "@pkg/components/tabs";
import { invoke } from "@tauri-apps/api";
import { isString } from "lodash-es";
import { objectToCamlCaseDeep } from "@pkg/utils/objects";
import { useTabSwitcher } from "@pkg/hooks/tab_switcher";
import { usePtyExit } from "@pkg/hooks/pty_exit";
import { MainContentLayout } from "@pkg/components/main_content_layout";
import { exit } from "@tauri-apps/api/process";
import { AppContext } from "@pkg/contexts/app_context";
import type { AppTheme } from "@pkg/models/app_theme";
import type { ThemeResponse } from "@pkg/messages";
import { type UnlistenFn, listen } from "@tauri-apps/api/event";
import { useBehaviorSubject } from "./hooks/observable";
import { SettingsModal } from "@pkg/components/settings_modal";
import "./App.scss";

const appState = new AppState();
appState.init();

function App() {
  const [theme, setTheme] = useState<AppTheme | null>(null);

  const loadTheme = useCallback(async () => {
    const themeResp: ThemeResponse = await invoke("get_a_theme");
    if (isString(themeResp.jsonContent)) {
      let themeContent = JSON.parse(themeResp.jsonContent) as AppTheme;
      themeContent = objectToCamlCaseDeep(themeContent);
      console.log("theme:", themeContent);
      setTheme(themeContent);
    }
  }, [setTheme]);

  const handlePtyExit = useCallback(
    async (id: string) => {
      const { sessionManager } = appState;
      sessionManager.removeTabById(id);
      if (sessionManager.sessions$.value.length === 0) {
        await exit(0);
      }
    },
    [appState]
  );

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    appState.sessionManager.newTab();
  }, [appState]);

  useEffect(() => {
    let unlisten: UnlistenFn[] = [];
    listen("tauri://blur", () => {
      appState.windowActive$.next(false);
    }).then((fn) => unlisten.push(fn));

    listen("tauri://focus", () => {
      appState.windowActive$.next(true);
    }).then((fn) => unlisten.push(fn));

    listen("tauri://menu", (event) => {
      switch (event.payload) {
        case "new-tab": {
          appState.sessionManager.newTab();
          break;
        }
        case "close-tab": {
          appState.sessionManager.closeTab();
          break;
        }
        case "explorer": {
          appState.toggleShowFileExplorer();
          break;
        }
        case "settings": {
          appState.toggleShowSettings();
          break;
        }
        default: {
        }
      }
    }).then((fn) => unlisten.push(fn));

    return () => {
      unlisten.forEach((fn) => fn());
    };
  }, [appState]);

  const showSettings = useBehaviorSubject(appState.showSettings$);

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
          result[`--t1-bright-${i}`] = color;
        }
        return;
      }

      if (isString(value)) {
        result[`--t1-${key}`] = value;
      }
    });

    return result;
  }, [theme]);

  const handleSettingsMaskClick = useCallback(() => {
    appState.toggleShowSettings();
  }, [appState]);

  return (
    <AppContext.Provider value={appState}>
      <>
        <div className="t1-app-container" style={styles}>
          {theme && (
            <>
              <Tabs appState={appState} />
              <MainContentLayout appState={appState} />
            </>
          )}
        </div>
        {showSettings && <SettingsModal onClose={handleSettingsMaskClick} />}
      </>
    </AppContext.Provider>
  );
}

export default App;
