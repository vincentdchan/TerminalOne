import { useMemo, useState, useContext } from "react";
import { RoundButton } from "./round_button";
import { SettingsGroup } from "./settings_group";
import Toggle from "@pkg/components/toggle";
import className from "classnames";
import { AppContext } from "@pkg/contexts/app_context";
import classes from "./settings_content.module.css";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import KeysSettingsTable from "./keys_setting_table";
import type { Settings } from "@pkg/settings";

interface SettingTabs {
  key: string;
  name: string;
  content: (settings: Settings) => React.ReactNode;
}

const settingTabs: SettingTabs[] = [
  {
    key: "general",
    name: "General",
    content: (settings: Settings) => (
      <div className="inner">
        <SettingsGroup
          title="Language"
          description="Change the language used in the user interface."
          right={<RoundButton>English</RoundButton>}
        />
        <SettingsGroup
          title="Auto update"
          description="Auto update Terminal One when a new version is available."
          right={<Toggle checked={settings.app["auto-update"]} />}
          paddingRight={12}
        />
      </div>
    ),
  },
  {
    key: "appearance",
    name: "Appearance",
    content: (settings: Settings) => (
      <div className="inner">
        <SettingsGroup
          title="Theme"
          description="Customize how Terminal One looks on your device."
          right={<RoundButton>Dark</RoundButton>}
        />
        <SettingsGroup
          title="Font size"
          description="Change the font size used in the terminal."
          right={<RoundButton>{settings.terminal["font-size"]}</RoundButton>}
        />
      </div>
    ),
  },
  {
    key: "terminal",
    name: "Terminal",
    content: (settings: Settings) => (
      <div className="inner">
        <SettingsGroup
          title="Scrollback"
          description="Change the number of lines that can be scrolled back in the terminal." 
          right={<RoundButton>{settings.terminal.scrollback}</RoundButton>}
        />
      </div>
    ),
  },
  {
    key: "keys",
    name: "Keys",
    content: (settings: Settings) => (
      <div className="inner">
        <KeysSettingsTable settings={settings.keys} />
      </div>
    ),
  }
];

export default function SettingsContent() {
  const [selectedKey, setSelectedKey] = useState(settingTabs[0].key);
  const appState = useContext(AppContext)!;
  const settings = useBehaviorSubject(appState.settings$)!;

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
          {tabContentMap.get(selectedKey)?.content(settings)}
        </div>
      </div>
    </div>
  );
}
