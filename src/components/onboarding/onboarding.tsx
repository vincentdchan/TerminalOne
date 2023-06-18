import { useContext, useCallback, memo, useState } from "react";
import classes from "./onboarding.module.css";
import classNames from "classnames";
import { AppContext } from "@pkg/contexts/app_context";
import { AppStatus } from "@pkg/models/app_state";
import { PrimaryButton } from "@pkg/components/button";
import Face from "./face.svg?url";

interface PrettyCheckBoxProps {
  content: string;
  description: string;
}

function PrettyCheckBox(props: PrettyCheckBoxProps) {
  const { content, description } = props;
  const [checked, setChecked] = useState(true);
  const handleClick = () => {
    setChecked(!checked);
  }
  return (
    <div className={classes.prettyCheckBox} onClick={handleClick}>
      <input type="checkbox" checked={checked} />
      <div className={classes.mainLine}>
        <p className="content">{content}</p>
        <p className="description">{description}</p>
      </div>
    </div>
  );
}

export const Onboarding = memo(() => {
  const appState = useContext(AppContext)!;
  const [showAni, setShowAni] = useState(false);

  const handleStart = useCallback(() => {
    appState.appStatus$.next(AppStatus.Ready);
    setShowAni(true);
  }, [appState]);

  const handleAnimationEnd = useCallback(() => {
    appState.showOnboarding$.next(false);
  }, [appState]);

  return (
    <div
      className={classNames(classes.onboarding, {
        ["swipe-down"]: showAni,
      })}
      onAnimationEnd={handleAnimationEnd}
    >
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
          Terminal One needs to install a script to your <i>.zshrc</i> file to
          work properly.
          <br />
          Press the button below to install the script.
        </p>
        <div className={classes.checkboxContainer}>
          <PrettyCheckBox
            content="Allow Terminal One to collect anonymous usage data."
            description="Help us improve Terminal One. We cannot track your identity from the collected data."
          />
          <PrettyCheckBox
            content="Allow Terminal One to collect diagnostic and performance data."
            description="Help us improve the performance and stability of Terminal One. We cannot track your identity from the collected data."
          />
        </div>
        <PrimaryButton onClick={handleStart}>
          Install and Get started
        </PrimaryButton>
      </div>
    </div>
  );
});
