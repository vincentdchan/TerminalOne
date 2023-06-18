import React from "react";
import classes from "./button.module.css";

export function PrimaryButton(props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  const { className = "", ...restProps } = props;
  return <button className={`${className} ${classes.button}`} {...restProps} />;
}

export function IconButton(props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  const { className = "", ...restProps } = props;
  return <button className={`${className} ${classes.iconButton}`} {...restProps} />;
}
