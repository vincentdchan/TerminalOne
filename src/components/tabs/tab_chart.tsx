import type { Session } from "@pkg/models/session";
import classes from "./tab_chart.module.css";
import { useRef } from "react";

export interface TabChartProps {
  session: Session;
}

export default function TabChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  return (
    <div className={classes.tabChart}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
