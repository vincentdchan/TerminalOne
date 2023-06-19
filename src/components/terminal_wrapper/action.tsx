import type { ActionData } from "@pkg/models/extension";
import { OUTLINE_DEFAULT_COLOR } from "./toolbar";
import Dropdown from "@pkg/components/dropdown";
import classes from "./action.module.css";

export interface ActionProps {
  data: ActionData;
}

function Action(props: ActionProps) {
  const { data } = props;
  const { title, color } = data;
  return (
    <Dropdown overlay={(style) => <div style={style}>Menu</div>}>
      {(options) => {
        return (
          <div
            ref={options.ref}
            className={`${classes.action} t1-noselect`}
            style={{
              border: `solid 2px ${color ?? OUTLINE_DEFAULT_COLOR}`,
            }}
            onClick={options.show}
          >
            {title}
          </div>
        );
      }}
    </Dropdown>
  );
}

export default Action;
