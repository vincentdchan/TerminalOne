import { memo } from "react";
import { type Session } from "@pkg/models/session";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import Action from "./action";
import "./toolbar.css";

export const OUTLINE_DEFAULT_COLOR = "rgb(250, 127, 86)";

export interface ToolbarProps {
  session: Session;
}

const Toolbar = memo((props: ToolbarProps) => {
  const { session } = props;
  const actions = useBehaviorSubject(session.actions$);

  return (
    <div className="t1-terminal-toolbar">
      {actions.map((action) => {
        return <Action key={action.extName} payload={action} />;
      })}
    </div>
  );
});

export default Toolbar;
