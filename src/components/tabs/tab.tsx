import { useCallback, useMemo } from "react";
import { Session } from "@pkg/models/session";
import { MdClose, MdFolder } from "react-icons/md";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import className from "classnames";
import { isString, isUndefined } from "lodash-es";
import { CMD_CHAR } from "@pkg/chars";
import { IconButton } from "@pkg/components/button";
import "./tab.css";
import { openContextMenu } from "@pkg/utils/context_menu";
import { mkMenuId } from "@pkg/utils/id_helper";

// const NeonBar = memo(() => {
//   const appState = useContext(AppContext)!;
//   const winActive = useBehaviorSubject(appState.windowActive$);
//   return (
//     <div
//       className={className("t1-neon-bar", {
//         "win-active": winActive,
//       })}
//     ></div>
//   );
// });

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

  const title = useBehaviorSubject(session.title$);
  const cwd = useBehaviorSubject(session.cwd$);

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
    let result = cwd;
    const lastPart = cwd.split("/").pop();
    if (isString(lastPart)) {
      result = lastPart;
    }
    return result;
  }, [cwd]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!showCloseBtn) {
      return;
    }

    openContextMenu({
      id: mkMenuId(),
      position: [e.clientX, e.clientY],
      items: [
        {
          key: "close",
          title: "Close",
        }
      ]
    }, (key) => {
      switch (key) {
        case "close":
          onClose?.();
          break;
        default: {}
      }
    });

  }, [showCloseBtn]);

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
      <div className="left">
        {showCloseBtn && (
          <IconButton onClick={handleClose}>
            <MdClose />
          </IconButton>
        )}
      </div>
      <div className="main">
        <div className="inner t1-ellipsis">
          {cwd ? (
            <>
              <span className="icon">
                <MdFolder />
              </span>
              <span className="content">{prettyCwd}</span>
            </>
          ) : (
            <span className="content">{title ?? "Untitled"}</span>
          )}
        </div>
      </div>
      {hintText && <div className="right">{hintText}</div>}
      {/* {active && showNeonBar && <NeonBar />} */}
    </div>
  );
}
