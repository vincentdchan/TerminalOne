import type { ActionData } from "@pkg/models/extension";
import { OUTLINE_DEFAULT_COLOR } from "./toolbar";
import classes from "./action.module.css";

export interface ActionProps {
  data: ActionData;
}

function Action(props: ActionProps) {
  const { data } = props;
  const { title, color } = data;
  return (
    <div
      className={`${classes.action} t1-noselect`}
      style={{
        border: `solid 2px ${color ?? OUTLINE_DEFAULT_COLOR}`
      }}
    >
      {title}
    </div>
  );
}

export default Action;
