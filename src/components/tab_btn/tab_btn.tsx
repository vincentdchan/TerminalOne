import React, {
  type FunctionComponent,
  type ButtonHTMLAttributes,
  forwardRef,
  ForwardedRef,
  useCallback,
} from "react";
import "./tab_btn.css";

export interface TabBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: any;
  unactive?: boolean;
}

const TabBtn = forwardRef(
  (props: TabBtnProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const { className = "", unactive, ...rest } = props;

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
    }, []);

    let newCls = className + " t1-tab-btn";

    if (unactive) {
      newCls += " unactive";
    }

    return (
      <button
        ref={ref}
        className={newCls}
        onContextMenu={handleContextMenu}
        {...rest}
      />
    );
  }
);

export default TabBtn as FunctionComponent<TabBtnProps>;
