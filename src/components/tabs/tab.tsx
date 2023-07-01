import { useCallback, useContext, useMemo } from "react";
import { Session } from "@pkg/models/session";
import { MdClose, MdFolder, MdHome } from "react-icons/md";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import className from "classnames";
import { isString, isUndefined } from "lodash-es";
import { CMD_CHAR } from "@pkg/chars";
import { IconButton } from "@pkg/components/button";
import { openContextMenu } from "@pkg/utils/context_menu";
import { mkMenuId } from "@pkg/utils/id_helper";
import { AppContext } from "@pkg/contexts/app_context";
import "./tab.css";

export interface TabProps {
  session: Session;
  last?: boolean;
  active?: boolean;
  showCloseBtn?: boolean;
  showNeonBar?: boolean;
  index: number;
  draggable?: boolean;
  dragging?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  onDragOver?: React.DragEventHandler<HTMLDivElement>;
  onDragEnd?: React.DragEventHandler<HTMLDivElement>;
  onClose?: () => void;
}

// const TabChart = lazy(() => import("./tab_chart"));

export function Tab(props: TabProps) {
  const {
    session,
    showCloseBtn,
    showNeonBar,
    last,
    active,
    index,
    dragging,
    onClose,
    ...restProps
  } = props;

  const appState = useContext(AppContext)!;
  const title = useBehaviorSubject(session.title$);
  const cwd = useBehaviorSubject(session.cwd$);
  const statistics = useBehaviorSubject(session.statistics$);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      onClose?.();
    },
    [onClose]
  );

  const prettyCwd = useMemo(() => {
    if (isUndefined(cwd)) {
      return undefined;
    }
    let result = appState.prettyPath(cwd);
    const lastPart = result.split("/").pop();
    if (isString(lastPart)) {
      result = lastPart;
    }

    const last = statistics.last();
    if (last && last.firstLevelChildrenNames.length === 1) {
      result += "(";
      result += last.firstLevelChildrenNames[0];
      result += ")";
    }
    return result;
  }, [appState, cwd, statistics]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const items: Record<string, any>[] = [];

      if (showCloseBtn) {
        items.push({
          key: "close-tab",
          title: "Close Tab",
        });
      }

      items.push({
        key: "duplicate-tab",
        title: "Duplicate Tab",
      });

      openContextMenu(
        {
          id: mkMenuId(),
          position: [e.clientX, e.clientY],
          items: items,
        },
        (key) => {
          switch (key) {
            case "close-tab":
              onClose?.();
              break;
            case "duplicate-tab": {
              const currentPath = session.cwd$.value;
              appState.sessionManager.newTab(currentPath);
              break;
            }
            default: {
            }
          }
        }
      );
    },
    [showCloseBtn]
  );

  const hintText = index <= 9 ? `${CMD_CHAR}${index + 1}` : undefined;

  return (
    <div
      className={className("t1-tab", {
        active,
        last,
        dragging: !!dragging,
      })}
      draggable
      onContextMenu={handleContextMenu}
      {...restProps}
    >
      {/* <div className="left">
        {showCloseBtn && (
          <IconButton onClick={handleClose}>
            <MdClose />
          </IconButton>
        )}
      </div> */}
      <div className="left">{hintText}</div>
      <div className="main">
        <div className="inner t1-ellipsis">
          {prettyCwd ? (
            <>
              <span className="icon">
                {prettyCwd === "~" ? <MdHome /> : <MdFolder />}
              </span>
              <span className="content">{prettyCwd}</span>
            </>
          ) : (
            <span className="content">{title ?? "Untitled"}</span>
          )}
        </div>
      </div>
      {showCloseBtn && (
        <div className="right">
          <IconButton onClick={handleClose}>
            <MdClose />
          </IconButton>
        </div>
      )}
      {/* {statLen > 1 && (
        <Suspense>
          <TabChart session={session} />
        </Suspense>
      )} */}
      {/* {active && showNeonBar && <NeonBar />} */}
    </div>
  );
}
