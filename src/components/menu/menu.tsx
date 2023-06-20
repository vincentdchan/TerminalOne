import React, { type CSSProperties, forwardRef } from "react";
import classes from "./menu.module.css";

export interface MenuProps {
  style?: CSSProperties;
  children?: React.ReactNode;
}

export const Menu = forwardRef(
  (props: MenuProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const { style, children } = props;
    return (
      <div ref={ref} style={style} className={classes.menu}>
        {children}
      </div>
    );
  }
);

export interface MenuItemProps {
  style?: CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children?: React.ReactNode;
}

export function MenuItem(props: MenuItemProps) {
  const { style, onClick, children } = props;
  return (
    <div
      style={style}
      className={`${classes.menuItem} t1-noselect t1-ellipsis`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function MenuDivider() {
  return <div className={classes.menuDivider} />;
}
