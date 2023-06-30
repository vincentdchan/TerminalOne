import React, { forwardRef } from "react";
import { OUTLINE_DEFAULT_COLOR } from "./toolbar";
import classes from "./action_ui.module.css";

export interface ActionUIProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  clickable?: boolean;
}

export const ActionUI = forwardRef((props: ActionUIProps, ref) => {
  let { className = "", style, color, clickable, ...restProps } = props;
  className += " ";
  className += classes.actionUI;
  className += " t1-noselect";
  if (clickable) {
    className += " ";
    className += "clickable";
  }
  return (
    <div
      ref={ref as any}
      style={{
        border: `solid 2px ${color ?? OUTLINE_DEFAULT_COLOR}`,
        ...style,
      }}
      className={className}
      {...restProps}
    />
  );
});
