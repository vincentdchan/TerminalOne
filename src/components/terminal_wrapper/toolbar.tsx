import { memo, useMemo, useContext } from "react";
import { type Session } from "@pkg/models/session";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import { isUndefined } from "lodash-es";
import classes from "./toolbar.module.css";
import { AppContext } from "@pkg/contexts/app_context";
import Action from "./action";

export const OUTLINE_DEFAULT_COLOR = "rgb(250, 127, 86)";

export interface ToolbarProps {
  session: Session;
}

const Toolbar = memo((props: ToolbarProps) => {
  const { session } = props;
  const cwd = useBehaviorSubject(session.cwd$);
  const actions = useBehaviorSubject(session.actions$);
  const appState = useContext(AppContext)!;

  const prettyCwd = useMemo(() => {
    if (isUndefined(cwd)) {
      return cwd;
    }
    return appState.prettyPath(cwd);
  }, [cwd, appState]);

  return (
    <div className="t1-terminal-toolbar">
      <div className={classes.path}>{prettyCwd}</div>
      {actions.map((action) => {
        return <Action key={action.extName} data={action.data} />;
      })}
    </div>
  );
});

export default Toolbar;
