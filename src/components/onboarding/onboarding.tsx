import { useContext, useCallback, memo } from "react";
import classes from "./onboarding.module.css";
import { AppContext } from "@pkg/contexts/app_context";
import { AppStatus } from "@pkg/models/app_state";

export const Onboarding = memo(() => {
  const appState = useContext(AppContext)!;

  const handleStart = useCallback(() => {
    appState.appStatus$.next(AppStatus.Ready);
  }, [appState]);

  return (
    <div className={classes.onboarding}>
      <div
        className={classes.titlebar}
        {...({ "data-tauri-drag-region": true } as any)}
      ></div>
      <div className={classes.content}>
        <h1 className="t1-noselect">Welcome</h1>
        <p>
          Terminal One needs to install a
          script to your <i>.zshrc</i> file to work properly.
          <br />
          Press the button below to install the script.
        </p>
        <button onClick={handleStart}>Install and Get started</button>
      </div>
    </div>
  );
});
