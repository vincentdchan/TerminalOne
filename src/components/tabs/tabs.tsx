import { useCallback, memo, CSSProperties } from "react";
import { Tab } from "./tab";
import { AppState } from "@pkg/models/app_state";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import { MdAdd } from "react-icons/md";
import { window as tauriWindow } from "@tauri-apps/api";
import { ExplorerBtn } from "./explorer_btn";
import TabBtn from "@pkg/components/tab_btn";
import "./tabs.scss";

export interface TabsProps {
  appState: AppState;
}

interface LeftPaddingProps {
  appState: AppState;
  onMouseDown?: React.MouseEventHandler;
  bottomBorder?: boolean;
  rightBorder?: boolean;
}

const borderStyle = "solid 1px var(--gpterm-border-color)";

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
    <div className="gpterm-left" style={style} onMouseDown={onMouseDown}>
      {/* <TrafficLight /> */}
      <ExplorerBtn appState={props.appState} />
    </div>
  );
});

interface RightPartProps {
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
    <div className="gpterm-right" style={style}>
      <TabBtn onClick={props.onClick}>
        <MdAdd />
      </TabBtn>
    </div>
  );
});

const CMD_CHAR = '\u2318';

export const Tabs = observer((props: TabsProps) => {
  const { appState } = props;
  const { sessionManager } = appState;
  const handleAddSession = useCallback(() => {
    sessionManager.newTab();
  }, [sessionManager]);
  const handleMouseDown = useCallback(async () => {
    await tauriWindow.appWindow.startDragging();
  }, []);
  const sessionsMoreThanOne = sessionManager.sessions.length > 1;
  return (
    <div
      className="gpterm-tabs gpterm-noselect"
      onMouseDown={sessionsMoreThanOne ? undefined : handleMouseDown}
    >
      <LeftPadding
        appState={appState}
        bottomBorder={sessionsMoreThanOne}
        rightBorder={
          sessionsMoreThanOne && sessionManager.activeSessionIndex === 0
        }
        onMouseDown={handleMouseDown}
      />
      <div className="gpterm-content">
        {sessionManager.sessions.map((session, index) => {
          const active = sessionManager.activeSessionIndex === index;
          const last = index === sessionManager.sessions.length - 1;
          return (
            <Tab
              key={`${index}`}
              session={session}
              showCloseBtn={sessionsMoreThanOne}
              active={active}
              last={last}
              hintText={index <= 9 ? `${CMD_CHAR}${index}` : undefined}
              onClick={() => {
                if (sessionManager.activeSessionIndex !== index) {
                  runInAction(() => {
                    sessionManager.activeSessionIndex = index;
                  });
                }
              }}
              onClose={() => {
                runInAction(() => {
                  sessionManager.removeTab(index);
                });
              }}
            />
          );
        })}
      </div>
      <RightPart
        bottomBorder={sessionsMoreThanOne}
        leftBorder={
          sessionsMoreThanOne &&
          sessionManager.activeSessionIndex ===
            sessionManager.sessions.length - 1
        }
        onClick={handleAddSession}
      />
    </div>
  );
});
