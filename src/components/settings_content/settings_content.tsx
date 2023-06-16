import { useMemo, useState } from "react";
import { RoundButton } from "./round_button";
import { SettingsGroup } from "./settings_group";
import Toggle from "@pkg/components/toggle";
import className from "classnames";
import classes from "./settings_content.module.css";

interface SettingTabs {
  key: string;
  name: string;
  content: () => React.ReactNode;
}

const settingTabs: SettingTabs[] = [
  {
    key: "general",
    name: "General",
    content: () => (
      <div className="inner">
        <SettingsGroup
          title="Language"
          description="Change the language used in the user interface."
          right={<RoundButton>English</RoundButton>}
        />
        <SettingsGroup
          title="Auto update"
          description="Auto update Terminal One when a new version is available."
          right={<Toggle />}
          paddingRight={12}
        />
      </div>
    ),
  },
  {
    key: "appearance",
    name: "Appearance",
    content: () => (
      <div className="inner">
        <SettingsGroup
          title="Theme"
          description="Customize how Terminal One looks on your device."
          right={<RoundButton>Dark</RoundButton>}
        />
      </div>
    ),
  },
];

export default function SettingsContent() {
  const [selectedKey, setSelectedKey] = useState(settingTabs[0].key);

  const tabContentMap = useMemo(() => {
    const result = new Map<string, SettingTabs>();
    for (const item of settingTabs) {
      result.set(item.key, item);
    }
    return result;
  }, []);

  return (
    <div className={classes.settingsContent}>
      <h1 className="t1-noselect">Settings</h1>
      <div className={classes.mainContent}>
        <div className={classes.settingsNavbar}>
          {settingTabs.map((tab) => (
            <div
              key={tab.key}
              onClick={() => setSelectedKey(tab.key)}
              className={className(`${classes.navbarItem} t1-noselect`, {
                active: tab.key === selectedKey,
              })}
            >
              {tab.name}
            </div>
          ))}
        </div>
        <div className={classes.navTabContent}>
          {tabContentMap.get(selectedKey)?.content()}
        </div>
      </div>
    </div>
  );
}
