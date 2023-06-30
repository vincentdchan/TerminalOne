import type { Session } from "@pkg/models/session";
import classes from "./tab_chart.module.css";
import Chart from "chart.js/auto";
import { useEffect, useRef } from "react";

export interface TabChartProps {
  session: Session;
}

export default function TabChart(props: TabChartProps) {
  const { session } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const chart = new Chart(canvasRef.current!, {
      type: "line",
      data: {
        labels: session.statistics.map((s, i) => i.toString()),
        datasets: [
          {
            label: "CPU",
            data: session.statistics.map((s) => s.cpuUsage),
          },
        ],
      },
    });

    const s = session.statisticsUpdated$.subscribe(() => {
      chart.data.datasets = [
        {
          label: "CPU",
          data: session.statistics.map((s) => s.cpuUsage),
        },
      ];
    });

    return () => s.unsubscribe();
  }, [session]);
  return (
    <div className={classes.tabChart}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
