import { memo } from "react";
import { Session } from "@pkg/models/session";
import ToolbarButtonUI from "./toolbar_button_ui";
import { useBehaviorSubject } from "@pkg/hooks/observable";

export interface StatActionProps {
  session: Session;
}

const coldestColor = [138, 206, 247];
const hottestColor = [275, 71, 76];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(a: number[], b: number[], t: number) {
  return a.map((c, i) => {
    const tmp = lerp(c, b[i], t)
    return Math.min(255, Math.round(tmp));
  });
}

const StatToolbarButton = memo((props: StatActionProps) => {
  const { session } = props;
  const statistics = useBehaviorSubject(session.statistics$);
  const lastStat = statistics.last();

  const cpu = lastStat?.cpuUsage ?? 0.0;
  const cpuT = cpu / 100.0;
  const color = lerpColor(coldestColor, hottestColor, cpuT);

  return (
    <ToolbarButtonUI color={`rgb(${color[0]}, ${color[1]}, ${color[2]})`}>
      cpu:{cpu.toFixed(1)}%
    </ToolbarButtonUI>
  );
});

StatToolbarButton.displayName = "StatToolbarButton";

export default StatToolbarButton;
