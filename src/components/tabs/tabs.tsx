import {
  useCallback,
  useContext,
  memo,
  CSSProperties,
  forwardRef,
  useRef,
  useEffect,
  useState,
} from "react";
import { Tab } from "./tab";
import { AppState } from "@pkg/models/app_state";
import {
  MdAdd,
  MdOutlineDashboard,
  MdOutlineDownloadForOffline,
} from "react-icons/md";
import { window as tauriWindow } from "@tauri-apps/api";
import { ExplorerBtn } from "./explorer_btn";
import TabBtn from "@pkg/components/tab_btn";
import { SortableList, type RenderProps } from "@pkg/components/sortable_list";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import { Session } from "@pkg/models/session";
import Tooltip from "@pkg/components/tooltip";
import { CMD_CHAR, SHIFT_CHAR } from "@pkg/chars";
import className from "classnames";
import { AppContext } from "@pkg/contexts/app_context";
import { invoke } from "@tauri-apps/api";
import { ReactComponent as SpinLogo } from "./loading-spin.svg";
import { isUndefined, throttle } from "lodash-es";
import classes from "./tabs.module.css";

interface NeonBarProps {
  width: number;
  left: number;
}

function NeonBar(props: NeonBarProps) {
  const { width, left } = props;
  const appState = useContext(AppContext)!;
  const winActive = useBehaviorSubject(appState.windowActive$);
  return (
    <div
      className={className(classes.neonBar, {
        "win-active": winActive,
      })}
      style={{
        width,
        left,
      }}
    ></div>
  );
}

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
  const { appState } = props;
  const updateInfo = useBehaviorSubject(appState.updateInfo$);
  const updateStatus = useBehaviorSubject(appState.updateStatus$);

  const installUpdate = throttle(async () => {
    if (updateStatus !== undefined) {
      return;
    }
    try {
      await invoke("install_update");
    } catch (err) {
      console.error("install update error", err);
    }
  }, 500);

  const handleUpdate = useCallback(() => {
    installUpdate();
  }, []);

  const style: CSSProperties = {};

  if (props.bottomBorder) {
    style.borderBottom = borderStyle;
  }

  if (props.leftBorder) {
    style.borderLeft = borderStyle;
  }

  return (
    <div className="t1-right" style={style}>
      {false && (
        <Tooltip content="Toolbox" direction="bottom">
          <GiftBoxBtn appState={props.appState} />
        </Tooltip>
      )}
      {!!updateInfo && (
        <Tooltip content="Install update" direction="bottom">
          <TabBtn
            disabled={!isUndefined(updateStatus)}
            className={classes.updateBtn}
            onClick={handleUpdate}
          >
            {updateStatus === "PENDING" ? (
              <div className={classes.spinLogoContainer}>
                <SpinLogo />
              </div>
            ) : (
              <MdOutlineDownloadForOffline />
            )}
          </TabBtn>
        </Tooltip>
      )}
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
  const [contentDivWidth, setContentDivWidth] = useState(0);
  const contentDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        const clientRect = contentDivRef.current!.getBoundingClientRect();
        setContentDivWidth(clientRect.width);
      });
    });

    observer.observe(contentDivRef.current!);

    return () => observer.disconnect();
  }, [contentDivRef]);

  const tabWidth =
    sessions.length === 0 ? 0 : contentDivWidth / sessions.length;
  const tabLeft = activeSessionIndex * tabWidth;

  const sessionsMoreThanOne = sessions.length > 1;
  const showNeonBar = sessionsMoreThanOne;
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
      <div ref={contentDivRef} className={classes.content}>
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
                key={session.id}
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
        {showNeonBar && <NeonBar width={tabWidth} left={tabLeft} />}
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
