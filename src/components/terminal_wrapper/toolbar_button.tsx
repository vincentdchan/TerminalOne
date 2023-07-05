import {
  isToolbarButtonDropdownMenuDivider,
  type ToolbarButtonDropdownMenuItemType,
  type ToolbarButtonExtPayload,
} from "@pkg/models/extension";
import Dropdown from "@pkg/components/dropdown";
import { Menu, MenuItem, MenuDivider } from "@pkg/components/menu";
import {
  Ref,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { AppContext } from "@pkg/contexts/app_context";
import { isString } from "lodash-es";
import ToolbarButtonUI from "./toolbar_button_ui";
import Tooltip from "@pkg/components/tooltip/Tooltip";
import { DropdownController } from "@pkg/components/dropdown/dropdown";
import type { Session } from "@pkg/models/session";

export interface ToolbarButtonProps {
  payload: ToolbarButtonExtPayload;
  index: number;
  session: Session;
}

function ToolbarButton(props: ToolbarButtonProps) {
  const { payload, session } = props;
  const dropdownController = useRef<DropdownController | null>(null);
  const appState = useContext(AppContext)!;
  const ext = appState.extensionManager.extensionMap.get(payload.extName);
  const handleMenuClick = useCallback(() => {
    appState.sessionManager.focusActiveSession();
  }, [appState]);
  useEffect(() => {
    const s = session.activeToolbarButtonIndex$.subscribe(async (activeIndex) => {
      if (!ext) {
        return;
      }
      if (activeIndex === props.index) {
        const homeDir = appState.homeDir$.value!;
        const result = await ext.generateActionMenuItems(homeDir, payload.data);
        if (!result) {
          return;
        }
        dropdownController.current?.open(result);
      } else {
        dropdownController.current?.close();
      }
    });

    return () => s.unsubscribe();
  }, [dropdownController.current, ext, session, props.index]);
  const { title, color } = payload.data;
  return (
    <Dropdown
      controller={dropdownController}
      overlay={({ style, ref, close, data }) => {
        const actionMenuItems = (data ??
          []) as ToolbarButtonDropdownMenuItemType[];
        return (
          <Menu
            style={style}
            ref={ref as Ref<HTMLDivElement>}
            onClick={handleMenuClick}
          >
            {actionMenuItems.map((item, index) => {
              if (isToolbarButtonDropdownMenuDivider(item)) {
                return <MenuDivider key={`divider-${index}`} />;
              }
              const title = item.title ?? item.command;
              const handleClick = (e: React.MouseEvent) => {
                e.preventDefault();
                const { command, onClick } = item;
                if (isString(command)) {
                  appState.sessionManager.executeCommand(`${item.command}\r`);
                }
                if (onClick) {
                  try {
                    onClick();
                  } catch (err) {
                    console.error("handle onClick error on action.tsx:", err);
                  }
                }
                close();
              };
              return (
                <MenuItem key={item.key} onClick={handleClick}>
                  {title}
                </MenuItem>
              );
            })}
          </Menu>
        );
      }}
    >
      {(options) => {
        return (
          <Tooltip
            content={`${payload.extName.toUpperCase()} (Ctrl+${
              props.index + 1
            })`}
            direction="bottomLeftAligned"
            childRef={options.ref}
          >
            <ToolbarButtonUI
              ref={options.ref}
              clickable={!!ext?.actionTriggerHandler}
              color={color}
              onClick={async () => {
                if (!ext) {
                  return;
                }
                const homeDir = appState.homeDir$.value!;
                const result = await ext.generateActionMenuItems(
                  homeDir,
                  payload.data
                );
                if (!result) {
                  return;
                }
                options.show(result);
              }}
            >
              {title}
            </ToolbarButtonUI>
          </Tooltip>
        );
      }}
    </Dropdown>
  );
}

export default ToolbarButton;
