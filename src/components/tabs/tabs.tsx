import { useCallback, memo, CSSProperties, forwardRef } from "react";
import { Tab } from "./tab";
import { AppState } from "@pkg/models/app_state";
import { MdAdd, MdOutlineDashboard } from "react-icons/md";
import { window as tauriWindow } from "@tauri-apps/api";
import { ExplorerBtn } from "./explorer_btn";
import TabBtn from "@pkg/components/tab_btn";
import { SortableList, type RenderProps } from "@pkg/components/sortable_list";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import { Session } from "@pkg/models/session";
import Tooltip from "@pkg/components/tooltip";
import { CMD_CHAR, SHIFT_CHAR } from "@pkg/chars";
import classes from "./tabs.module.css";

interface LeftPaddingProps {
  appState: AppState;
  onMouseDown?: React.MouseEventHandler;
  bottomBorder?: boolean;
  rightBorder?: boolean;
}

const borderStyle = "solid 1px var(--t1-border-color)";

const LeftPadding = memo((props: LeftPaddingProps) => {
  const { bottomBorder, rightBorder, onMouseDown } = props;

  const style: CSSProperties = {};

  if (bottomBorder) {
    style.borderBottom = borderStyle;
  }

  if (rightBorder) {
    style.borderRight = borderStyle;
  }

  return (
    <div className="t1-left" style={style} onMouseDown={onMouseDown}>
      <Tooltip
        content={`File Explorer (${SHIFT_CHAR}${CMD_CHAR}E)`}
        direction="bottom"
      >
        <ExplorerBtn appState={props.appState} />
      </Tooltip>
    </div>
  );
});

interface GiftBoxBtnProps {
  appState: AppState;
}

const GiftBoxBtn = forwardRef((props: GiftBoxBtnProps, ref: any) => {
  const { appState } = props;
  const showGiftBox = useBehaviorSubject(appState.showGiftBox$);
  const handleClick = useCallback(() => {
    appState.toggleShowGiftBox();
  }, [appState]);
  return (
    <TabBtn ref={ref} onClick={handleClick} unactive={!showGiftBox}>
      <MdOutlineDashboard />
    </TabBtn>
  );
});

interface RightPartProps {
  appState: AppState;
  bottomBorder?: boolean;
  leftBorder?: boolean;
  onClick?: () => void;
}

const RightPart = memo((props: RightPartProps) => {
  const style: CSSProperties = {};

  if (props.bottomBorder) {
    style.borderBottom = borderStyle;
  }

  if (props.leftBorder) {
    style.borderLeft = borderStyle;
  }

  return (
    <div className="t1-right" style={style}>
      <Tooltip content="Toolbox" direction="bottom">
        <GiftBoxBtn appState={props.appState} />
      </Tooltip>
      <TabBtn onClick={props.onClick}>
        <MdAdd />
      </TabBtn>
    </div>
  );
});

export interface TabsProps {
  appState: AppState;
}

export function Tabs(props: TabsProps) {
  const { appState } = props;
  const { sessionManager } = appState;
  const handleAddSession = useCallback(() => {
    sessionManager.newTab();
  }, [sessionManager]);
  const handleMouseDown = useCallback(async () => {
    await tauriWindow.appWindow.startDragging();
  }, []);
  const sessions = useBehaviorSubject(sessionManager.sessions$);
  const activeSessionIndex = useBehaviorSubject(
    sessionManager.activeSessionIndex$
  );
  const sessionsMoreThanOne = sessions.length > 1;
  return (
    <div
      className={`${classes.tabs} t1-noselect`}
      onMouseDown={sessionsMoreThanOne ? undefined : handleMouseDown}
    >
      <LeftPadding
        appState={appState}
        rightBorder={sessionsMoreThanOne && activeSessionIndex === 0}
        onMouseDown={handleMouseDown}
      />
      <div className={classes.content}>
        <SortableList
          items={sessions}
          onMove={(from, to) => {
            sessionManager.moveTab(from, to);
          }}
          renderItem={(props: RenderProps) => {
            const { index, item, ...restProps } = props;
            const session = item as Session;
            const active = activeSessionIndex === index;
            const last = index === sessions.length - 1;

            return (
              <Tab
                key={`${index}`}
                session={session}
                showCloseBtn={sessionsMoreThanOne}
                showNeonBar={sessionsMoreThanOne}
                draggable={sessionsMoreThanOne}
                active={active}
                last={last}
                index={index}
                onClick={() => {
                  if (activeSessionIndex !== index) {
                    sessionManager.activeSessionIndex$.next(index);
                  }
                }}
                onClose={() => {
                  sessionManager.removeTab(index);
                }}
                {...restProps}
              />
            );
          }}
        />
      </div>
      <RightPart
        appState={appState}
        leftBorder={
          sessionsMoreThanOne && activeSessionIndex === sessions.length - 1
        }
        onClick={handleAddSession}
      />
    </div>
  );
}
