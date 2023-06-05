import { useCallback, } from "react";
import { Session } from "@pkg/models/session";
import { MdClose, MdFolder } from "react-icons/md";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import "./tab.scss";

export interface TabProps {
  session: Session;
  last?: boolean;
  active?: boolean;
  showCloseBtn?: boolean;
  hintText?: string;
  onClick?: () => void;
  onClose?: () => void;
}

export function Tab(props: TabProps) {
  const { session, showCloseBtn, last, active, hintText, onClick, onClose } =
    props;

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

  let className = "gpterm-tab";

  if (active) {
    className += " active";
  }

  if (last) {
    className += " last";
  }

  return (
    <div className={className} onClick={onClick}>
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
              {prettyCwd(cwd)}
            </>
          ) : (
            title ?? "Untitled"
          )}
        </div>
      </div>
      {hintText && <div className="right">{hintText}</div>}
    </div>
  );
}

const PREFIX = "file://";

function prettyCwd(cwd: string): string {
  if (cwd.startsWith(cwd)) {
    return cwd.slice(PREFIX.length);
  }
  return cwd;
}
