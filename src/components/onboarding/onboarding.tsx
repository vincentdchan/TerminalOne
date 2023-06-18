import { useContext, useCallback, memo } from "react";
import classes from "./onboarding.module.css";
import { AppContext } from "@pkg/contexts/app_context";
import { AppStatus } from "@pkg/models/app_state";
import { PrimaryButton } from "@pkg/components/button";
import Face from "./face.svg?url";

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
        <div className={classes.header}>
          <img src={Face} />
          <h1 className="t1-noselect">Welcome</h1>
        </div>
        <p>
          Terminal One needs to install a
          script to your <i>.zshrc</i> file to work properly.
          <br />
          Press the button below to install the script.
        </p>
        <PrimaryButton onClick={handleStart}>Install and Get started</PrimaryButton>
      </div>
    </div>
  );
});
