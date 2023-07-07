import React, { forwardRef } from "react";
import { OUTLINE_DEFAULT_COLOR } from "./toolbar";
import classes from "./toolbar_button_ui.module.css";

export interface ToolbarButtonUIProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  clickable?: boolean;
}

const ToolbarButtonUI = forwardRef((props: ToolbarButtonUIProps, ref) => {
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

ToolbarButtonUI.displayName = "ToolbarButtonUI";

export default ToolbarButtonUI;
