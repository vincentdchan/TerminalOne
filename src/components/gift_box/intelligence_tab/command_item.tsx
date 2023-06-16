import { type ReactNode, useCallback, useContext } from "react";
import { AppContext } from "@pkg/contexts/app_context";
import "./command_item.css";

export interface CommandItemProps {
  cmd: string;
  children?: ReactNode;
}

export function CommandItem(props: CommandItemProps) {
  const { cmd } = props;
  const appState = useContext(AppContext);
  const handleDblClick = useCallback(() => {
    appState?.sessionManager.executeCommand(cmd);
  }, [cmd, appState]);
  return (
    <div className="t1-command-item" onDoubleClick={handleDblClick}>
      {props.children}
    </div>
  );
}
