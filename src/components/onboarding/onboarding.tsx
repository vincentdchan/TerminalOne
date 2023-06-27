import React, { useContext, useCallback, memo, useState } from "react";
import classNames from "classnames";
import { AppContext } from "@pkg/contexts/app_context";
import { AppStatus } from "@pkg/models/app_state";
import { PrimaryButton } from "@pkg/components/button";
import Face from "./face.svg?url";
import * as uiStore from "@pkg/utils/ui_store";
import { StoreKeys } from "@pkg/constants"
import classes from "./onboarding.module.css";
import { invoke } from "@tauri-apps/api";

interface PrettyCheckBoxProps {
  content: string;
  description: string;
  checked?: boolean;
  onToggle?: () => void;
}

function PrettyCheckBox(props: PrettyCheckBoxProps) {
  const { checked, content, description, onToggle } = props;
  return (
    <div className={classes.prettyCheckBox} onClick={onToggle}>
      <input type="checkbox" onChange={onToggle} checked={checked} />
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

  const [usageDataChecked, setUsageDataChecked] = useState(true);
  const [diagnosticDataChecked, setDiagnosticDataChecked] = useState(true);
  const [processing, setProcessing] = useState(false);

  const submit = async () => {
    if (processing) {
      return;
    }
    setProcessing(true);
    try {
      await uiStore.store({
        _id: StoreKeys.collectUsageData,
        value: usageDataChecked,
      });
      await uiStore.store({
        _id: StoreKeys.collectDiagnosticData,
        value: diagnosticDataChecked,
      });
      await invoke("install_script");
      await uiStore.store({
        _id: StoreKeys.onboarding,
        value: 1,
      });
    } catch (err) {
      console.error(err);
    } finally {
      appState.appStatus$.next(AppStatus.Ready);
      setShowAni(true);
      setProcessing(false);
    }
  }

  const handleStart = useCallback(() => {
    submit();
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
            checked={usageDataChecked}
            onToggle={() => setUsageDataChecked(!usageDataChecked)}
          />
          <PrettyCheckBox
            content="Allow Terminal One to collect diagnostic and performance data."
            description="Help us improve the performance and stability of Terminal One. We cannot track your identity from the collected data."
            checked={diagnosticDataChecked}
            onToggle={() => setDiagnosticDataChecked(!diagnosticDataChecked)}
          />
        </div>
        <PrimaryButton onClick={handleStart}>
          Install and Get started
        </PrimaryButton>
      </div>
    </div>
  );
});
