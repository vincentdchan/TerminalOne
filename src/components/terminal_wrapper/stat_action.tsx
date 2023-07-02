import { memo } from "react";
import { Session } from "@pkg/models/session";
import { ActionUI } from "./action_ui";
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

const _1TB = 1024 * 1024 * 1024;
const _1GB = 1024 * 1024;
const _1MB = 1024;

function bytesToHumanReadable(kilobytes: number) {
  if (kilobytes > _1TB) {
    return `${(kilobytes / _1TB).toFixed(2)} TB`;
  } else if (kilobytes > _1GB) {
    return `${(kilobytes / _1GB).toFixed(2)} GB`;
  } else if (kilobytes > _1MB) {
    return `${(kilobytes / _1MB).toFixed(2)} MB`;
  } else {
    return `${kilobytes} KB`;
  }
}

const StatAction = memo((props: StatActionProps) => {
  const { session } = props;
  const statistics = useBehaviorSubject(session.statistics$);
  const lastStat = statistics.last();

  const cpu = lastStat?.cpuUsage ?? 0.0;
  const cpuT = cpu / 100.0;
  const color = lerpColor(coldestColor, hottestColor, cpuT);

  const mem = lastStat?.memUsage ?? 0;

  return (
    <ActionUI color={`rgb(${color[0]}, ${color[1]}, ${color[2]})`}>
      cpu:{cpu.toFixed(1)}% mem:{bytesToHumanReadable(mem)}
    </ActionUI>
  );
});

export default StatAction;
