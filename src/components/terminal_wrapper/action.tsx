import { isDivider, type ActionData, type ActionMenuItemType } from "@pkg/models/extension";
import { OUTLINE_DEFAULT_COLOR } from "./toolbar";
import Dropdown from "@pkg/components/dropdown";
import { Menu, MenuItem, MenuDivider } from "@pkg/components/menu";
import classNames from "classnames";
import classes from "./action.module.css";
import { useState } from "react";

export interface ActionProps {
  data: ActionData;
}

function Action(props: ActionProps) {
  const { data } = props;
  const [actionMenuItems, setActionMenuItems] = useState<ActionMenuItemType[]>([]);
  const { title, color } = data;
  return (
    <Dropdown
      overlay={(style) => (
        <Menu style={style}>
          {actionMenuItems.map((item, index) => {
            if (isDivider(item)) {
              return <MenuDivider key={`divider-${index}`} />;
            }
            return <MenuItem key={item.key}>{item.title}</MenuItem>;
          })}
        </Menu>
      )}
    >
      {(options) => {
        return (
          <div
            ref={options.ref}
            className={classNames(`${classes.action} t1-noselect`, {
              clickable: !!data.onTrigger,
            })}
            style={{
              border: `solid 2px ${color ?? OUTLINE_DEFAULT_COLOR}`,
            }}
            onClick={async () => {
              if (!data.onTrigger) {
                return;
              }
              const result = await data.onTrigger();
              if (!result) {
                return;
              }
              setActionMenuItems(result);
              options.show();
            }}
          >
            {title}
          </div>
        );
      }}
    </Dropdown>
  );
}

export default Action;
