import { useCallback, useContext, memo } from "react";
import { Session } from "@pkg/models/session";
import { MdClose, MdFolder } from "react-icons/md";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import className from "classnames";
import { AppContext } from "@pkg/contexts/app_context";
import "./tab.scss";

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
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  onDragOver?: React.DragEventHandler<HTMLDivElement>;
  onDragEnd?: React.DragEventHandler<HTMLDivElement>;
  onClose?: () => void;
}

const CMD_CHAR = "\u2318";

export function Tab(props: TabProps) {
  const {
    session,
    showCloseBtn,
    showNeonBar,
    last,
    active,
    index,
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

  const hintText = index <= 9 ? `${CMD_CHAR}${index}` : undefined;

  return (
    <div
      className={className("t1-tab", {
        active,
        last,
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
        <div className="inner">
          {cwd ? (
            <>
              <span className="icon">
                <MdFolder />
              </span>
              {cwd}
            </>
          ) : (
            title ?? "Untitled"
          )}
        </div>
      </div>
      {hintText && <div className="right">{hintText}</div>}
      {active && showNeonBar && <NeonBar />}
    </div>
  );
}
