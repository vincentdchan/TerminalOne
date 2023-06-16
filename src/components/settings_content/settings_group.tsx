import classes from "./settings_group.module.css";

export interface SettingsGroupProps {
  title: string;
  description: string;
  right?: React.ReactNode;
  paddingRight?: number;
}

export function SettingsGroup(props: SettingsGroupProps) {
  const { title, description, right, paddingRight } = props;
  return (
    <div className={classes.settingsGroup}>
      <div className={classes.left}>
        <div className={classes.title}>{title}</div>
        <div className={classes.description}>{description}</div>
      </div>
      {right && (
        <div style={{ paddingRight }} className={classes.right}>
          {right}
        </div>
      )}
    </div>
  );
}
