import {
  type FunctionComponent,
  type ButtonHTMLAttributes,
  forwardRef,
  ForwardedRef,
} from "react";
import "./tab_btn.css";

export interface TabBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: any;
  unactive?: boolean;
}

const TabBtn = forwardRef(
  (props: TabBtnProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const { className = "", unactive, ...rest } = props;
    let newCls = className + " t1-tab-btn";

    if (unactive) {
      newCls += " unactive";
    }

    return <button ref={ref} className={newCls} {...rest} />;
  }
);

export default TabBtn as FunctionComponent<TabBtnProps>;
