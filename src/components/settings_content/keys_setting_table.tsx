import type { KeysSettings } from "@pkg/settings";
import classes from "./keys_setting_table.module.css";

export interface KeysSettingsTableProps {
  settings: KeysSettings;
}

function KeysSettingsTable(props: KeysSettingsTableProps) {
  const { settings } = props;
  const { bindings = {} } = settings;
  return (
    <div>
      <div className={classes.bindingItemTitle}>Bindings</div>
      {Object.entries(bindings).map((([key, value], index) => (
        <div className={classes.bindingItem} key={`${index}`}>
          <div className={classes.key}>{key}</div>
          <div className={classes.value}>{value}</div>
        </div>
      )))}
    </div>
  )
}

export default KeysSettingsTable;
