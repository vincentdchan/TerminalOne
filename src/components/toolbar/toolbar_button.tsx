import {
  isToolbarButtonDropdownMenuDivider,
  type ToolbarButtonDropdownMenuItemType,
  type ToolbarButtonExtPayload,
} from "@pkg/models/extension";
import Dropdown from "@pkg/components/dropdown";
import { Menu, MenuItem, MenuDivider } from "@pkg/components/menu";
import React, {
  Ref,
  useCallback,
  useContext,
  useEffect,
  useRef,
  forwardRef,
  useState,
} from "react";
import { fromEvent } from "rxjs";
import { AppContext } from "@pkg/contexts/app_context";
import { isString } from "lodash-es";
import ToolbarButtonUI from "./toolbar_button_ui";
import Tooltip from "@pkg/components/tooltip/Tooltip";
import { DropdownController } from "@pkg/components/dropdown/dropdown";
import type { Session } from "@pkg/models/session";
import { AppState } from "@pkg/models/app_state";

export interface DropdownMenuProps {
  actionMenuItems: ToolbarButtonDropdownMenuItemType[];
  appState: AppState;
  style?: React.CSSProperties;
  onClick?: () => void;
  onClose?: () => void;
}

const DropdownMenu = forwardRef((props: DropdownMenuProps, ref: any) => {
  const { actionMenuItems, appState, style, onClick, onClose } = props;
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const executeDropdownMenuItem = useCallback((item: ToolbarButtonDropdownMenuItemType) => {
    if (isToolbarButtonDropdownMenuDivider(item)) {
      return;
    }
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
  }, [appState]);
  useEffect(() => {
    const keydown = fromEvent<KeyboardEvent>(window, "keydown", {
      capture: true,
    });
    const s = keydown.subscribe((e: KeyboardEvent) => {
      // if arrow up
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopImmediatePropagation();

        let next = selectedIndex;
        do {
          next--;
        } while (actionMenuItems[next] && isToolbarButtonDropdownMenuDivider(actionMenuItems[next]));

        if (next < -1) {
          next = actionMenuItems.length - 1;
        }

        setSelectedIndex(next);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopImmediatePropagation();
        let next = selectedIndex;

        do {
          next++
        } while (actionMenuItems[next] && isToolbarButtonDropdownMenuDivider(actionMenuItems[next]));

        if (next >= actionMenuItems.length) {
          next = -1;
        }
        setSelectedIndex(next);
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const item = actionMenuItems[selectedIndex];
        if (item) {
          executeDropdownMenuItem(item);
        }
        onClose?.();
      }
    });

    return () => s.unsubscribe();

  }, [selectedIndex, actionMenuItems.length, onClose, executeDropdownMenuItem]);
  return (
    <Menu style={style} ref={ref as Ref<HTMLDivElement>} onClick={onClick}>
      {actionMenuItems.map((item, index) => {
        if (isToolbarButtonDropdownMenuDivider(item)) {
          return <MenuDivider key={`divider-${index}`} />;
        }
        const title = item.title ?? item.command;
        const handleClick = (e: React.MouseEvent) => {
          e.preventDefault();
          executeDropdownMenuItem(item);
          onClose?.();
        };
        return (
          <MenuItem
            key={item.key}
            selected={index === selectedIndex}
            onClick={handleClick}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {title}
          </MenuItem>
        );
      })}
    </Menu>
  );
});

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
    const s = session.activeToolbarButtonIndex$.subscribe(
      async (activeIndex) => {
        if (!ext) {
          return;
        }
        if (activeIndex === props.index) {
          const homeDir = appState.homeDir$.value!;
          const result = await ext.generateActionMenuItems(
            homeDir,
            payload.data
          );
          if (!result) {
            return;
          }
          dropdownController.current?.open(result);
        } else {
          dropdownController.current?.close();
        }
      }
    );

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
          <DropdownMenu
            actionMenuItems={actionMenuItems}
            appState={appState}
            style={style}
            ref={ref as Ref<HTMLDivElement>}
            onClick={handleMenuClick}
            onClose={close}
          />
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
