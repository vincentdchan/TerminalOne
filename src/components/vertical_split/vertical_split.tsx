import React, { memo } from "react";
import "./vertical_split.scss";

interface VerticalSplitProps {
  left?: number;
  right?: number;
  show?: boolean;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
}

const WIDTH = 5;

export const VerticalSplit = memo((props: VerticalSplitProps) => {
  const { onMouseDown, show, left, right } = props;
  return (
    <div
      className="t1-vertical-split t1-noselect"
      onMouseDown={onMouseDown}
      style={{
        width: WIDTH,
        display: show ? "" : "none",
        right: right ? right - Math.floor(WIDTH / 2) : undefined,
        left: left ? left - Math.ceil(WIDTH / 2) : undefined,
      }}
    >
      <div className="central"></div>
    </div>
  );
});
