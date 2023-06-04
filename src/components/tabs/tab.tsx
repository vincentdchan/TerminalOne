import { Session } from "@pkg/models/session";
import { useCallback } from "react";
import { observer } from "mobx-react";
import { MdClose } from "react-icons/md";
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

export const Tab = observer((props: TabProps) => {
  const { session, showCloseBtn, last, active, hintText, onClick, onClose } = props;

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
          {session.title ?? "Untitled"}
        </div>
      </div>
      {hintText && <div className="right">{hintText}</div>}
    </div>
  );
});
