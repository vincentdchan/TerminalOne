import { Session } from "@pkg/models/session";
import { useCallback } from "react";
import { observer } from "mobx-react";
import { MdClose } from "react-icons/md";
import "./tab.scss";

export interface TabProps {
  session: Session;
  active?: boolean;
  showCloseBtn?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

export const Tab = observer((props: TabProps) => {
  const { session, showCloseBtn, active, onClick, onClose } = props;

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

  return (
    <div className={className} onClick={onClick}>
      <div className="main">{session.title ?? "Untitled"}</div>
      <div className="right">
        {showCloseBtn && (
          <button onClick={handleClose}>
            <MdClose />
          </button>
        )}
      </div>
    </div>
  );
});
