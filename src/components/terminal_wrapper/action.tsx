import {
  isDivider,
  type ActionMenuItemType,
  type ActionPayload,
} from "@pkg/models/extension";
import { OUTLINE_DEFAULT_COLOR } from "./toolbar";
import Dropdown from "@pkg/components/dropdown";
import { Menu, MenuItem, MenuDivider } from "@pkg/components/menu";
import classNames from "classnames";
import classes from "./action.module.css";
import { Ref, useContext, useState } from "react";
import { AppContext } from "@pkg/contexts/app_context";

export interface ActionProps {
  payload: ActionPayload;
}

function Action(props: ActionProps) {
  const appState = useContext(AppContext)!;
  const { payload } = props;
  const [actionMenuItems, setActionMenuItems] = useState<ActionMenuItemType[]>(
    []
  );
  const ext = appState.extensionManager.extensionMap.get(payload.extName);
  const { title, color } = payload.data;
  return (
    <Dropdown
      overlay={({ style, ref, close }) => (
        <Menu style={style} ref={ref as Ref<HTMLDivElement>}>
          {actionMenuItems.map((item, index) => {
            if (isDivider(item)) {
              return <MenuDivider key={`divider-${index}`} />;
            }
            const title = item.title ?? item.command;
            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              appState.sessionManager.executeCommand(`${item.command}\r`);
              close();
            };
            return (
              <MenuItem key={item.key} onClick={handleClick}>
                {title}
              </MenuItem>
            );
          })}
        </Menu>
      )}
    >
      {(options) => {
        return (
          <div
            ref={options.ref}
            className={classNames(`${classes.action} t1-noselect`, {
              clickable: !!ext?.actionTriggerHandler
            })}
            style={{
              border: `solid 2px ${color ?? OUTLINE_DEFAULT_COLOR}`,
            }}
            onClick={async () => {
              if (!ext) {
                return;
              }
              const homeDir = appState.homeDir$.value!;
              const result = await ext.generateActionMenuItems(homeDir, payload.data);
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
