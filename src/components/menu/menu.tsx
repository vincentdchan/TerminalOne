import React, { type CSSProperties, forwardRef } from "react";
import classNames from "classnames";
import classes from "./menu.module.css";

export interface MenuProps {
  style?: CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children?: React.ReactNode;
}

export const Menu = forwardRef(
  (props: MenuProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const { style, onClick, children } = props;
    return (
      <div ref={ref} style={style} onClick={onClick} className={classes.menu}>
        {children}
      </div>
    );
  }
);

export interface MenuItemProps {
  selected?: boolean;
  style?: CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  children?: React.ReactNode;
}

export function MenuItem(props: MenuItemProps) {
  const { style, selected, ...restProps } = props;
  return (
    <div
      style={style}
      className={classNames(`${classes.menuItem} t1-noselect t1-ellipsis`, {
        selected,
      })}
      {...restProps}
    />
  );
}

export function MenuDivider() {
  return <div className={classes.menuDivider} />;
}
