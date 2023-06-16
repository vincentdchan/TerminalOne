import { useCallback, useContext, useMemo, memo } from "react";
import { Session } from "@pkg/models/session";
import { MdClose, MdFolder } from "react-icons/md";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import className from "classnames";
import { isUndefined } from "lodash-es";
import { AppContext } from "@pkg/contexts/app_context";
import { CMD_CHAR } from "@pkg/chars";
import "./tab.css";

const NeonBar = memo(() => {
  const appState = useContext(AppContext)!;
  const winActive = useBehaviorSubject(appState.windowActive$);
  return (
    <div
      className={className("t1-neon-bar", {
        "win-active": winActive,
      })}
    ></div>
  );
});

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

  const appState = useContext(AppContext)!;
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
      return cwd;
    }
    return appState.prettyPath(cwd);
  }, [cwd, appState]);

  const hintText = index <= 9 ? `${CMD_CHAR}${index}` : undefined;

  return (
    <div
      className={className("t1-tab", {
        active,
        last,
        dragging: !!dragging,
      })}
      draggable
      {...restProps}
    >
      <div className="left">
        {showCloseBtn && (
          <button onClick={handleClose}>
            <MdClose />
          </button>
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
      {active && showNeonBar && <NeonBar />}
    </div>
  );
}
