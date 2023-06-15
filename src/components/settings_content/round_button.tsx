import React from "react";
import "./round_button.scss";

export interface RoundButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}
export function RoundButton(props: RoundButtonProps) {
  const { className = "", ...restProps } = props;
  const myCls = className + " t1-round-button";
  return <button className={myCls} {...restProps} />;
}
