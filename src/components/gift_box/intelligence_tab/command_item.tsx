import { type ReactNode, useCallback, useContext } from "react";
import { AppContext } from "@pkg/contexts/app_context";
import { take } from "rxjs";
import "./command_item.scss";

export interface CommandItemProps {
  cmd: string;
  children?: ReactNode;
}

export function CommandItem(props: CommandItemProps) {
  const { cmd } = props;
  const appState = useContext(AppContext);
  const handleDblClick = useCallback(() => {
    appState?.sessionManager.activeSession$
      .pipe(take(1))
      .subscribe((activeSession) => {
        if (!activeSession) {
          return;
        }
        activeSession.shellInput$.next(cmd);
      });
  }, [cmd, appState]);
  return (
    <div className="gpterm-command-item" onDoubleClick={handleDblClick}>
      {props.children}
    </div>
  );
}
