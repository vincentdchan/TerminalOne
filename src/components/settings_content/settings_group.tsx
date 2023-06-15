export interface SettingsGroupProps {
  title: string;
  description: string;
  right?: React.ReactNode;
}

export function SettingsGroup(props: SettingsGroupProps) {
  const { title, description, right } = props;
  return (
    <div className="t1-settings-group">
      <div className="left">
        <div className="title">{title}</div>
        <div className="description">{description}</div>
      </div>
      {right && <div className="right">{right}</div>}
    </div>
  );
}
