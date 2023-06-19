import React, { Component } from "react";
import classes from "./mask.module.css";

export interface MaskProps {
  children?: any;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

class Mask extends Component<MaskProps> {
  override render() {
    const { children, onClick } = this.props;
    return (
      <div className={classes.mask} onClick={onClick}>
        {children}
      </div>
    );
  }
}

export default Mask;
