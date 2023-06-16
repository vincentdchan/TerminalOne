import React from "react";
import "./toggle.css";

export interface ToggleProps {
  checked?: boolean;
  style?: React.CSSProperties;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function Toggle(props: ToggleProps) {
  const { checked, onChange, style } = props;
  return (
    <label style={style} className="switch">
      <input checked={checked} onChange={onChange} type="checkbox" />
      <span className="slider round"></span>
    </label>
  );
}
