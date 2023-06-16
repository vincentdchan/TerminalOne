import { FunctionComponent, ButtonHTMLAttributes } from "react";
import "./tab_btn.css";

export interface TabBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  unactive?: boolean;
}

function TabBtn(props: TabBtnProps) {
  const { className = "", unactive, ...rest } = props;
  let newCls = className + " t1-tab-btn";

  if (unactive) {
    newCls += " unactive";
  }

  return <button className={newCls} {...rest} />;
}

export default TabBtn as FunctionComponent<TabBtnProps>;
