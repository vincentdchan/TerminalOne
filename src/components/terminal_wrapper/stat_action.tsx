import { memo, useEffect, useState } from "react";
import { Session } from "@pkg/models/session";
import { ActionUI } from "./action_ui";
import { TerminalStatistic } from "@pkg/messages";

export interface StatActionProps {
  session: Session;
}

const StatAction = memo((props: StatActionProps) => {
  const { session } = props;
  const [lastStat, setLastStat] = useState<TerminalStatistic | undefined>(undefined);


  useEffect(() => {
    setLastStat(session.statistics[session.statistics.length - 1]);
    const s = session.statisticsUpdated$.subscribe(() => {
      setLastStat(session.statistics[session.statistics.length - 1]);
    });
    return () => s.unsubscribe();
  }, [session]);

  const cpu = lastStat?.cpuUsage.toFixed(2) ?? 0.00;

  return <ActionUI>cpu:{cpu}%</ActionUI>;
});

export default StatAction;
