import React, { type CSSProperties } from "react";
import classes from "./menu.module.css";

export interface MenuProps {
  style?: CSSProperties;
  children?: React.ReactNode;
}

export function Menu(props: MenuProps) {
  const { style, children } = props;
  return (
    <div style={style} className={classes.menu}>
      {children}
    </div>
  );
}

export interface MenuItemProps {
  style?: CSSProperties;
  children?: React.ReactNode;
}

export function MenuItem(props: MenuItemProps) {
  const { style, children } = props;
  return (
    <div style={style} className={`${classes.menuItem} t1-noselect t1-ellipsis`}>
      {children}
    </div>
  );
}

export function MenuDivider() {
  return <div className={classes.menuDivider} />;
}
