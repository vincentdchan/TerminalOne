import ReactDOM from "react-dom";
import { memo, Suspense, lazy, useEffect } from "react";
import { fromEvent } from "rxjs";
import { filter } from "rxjs/operators";
import "./settings_modal.scss";

const Mask = memo((props: { onClick?: React.MouseEventHandler }) => {
  const { onClick } = props;
  return <div onClick={onClick} className="t1-settings-modal-mask"></div>;
});

export interface SettingsModalProps {
  onClose?: () => void;
}

const SettingsContent = lazy(
  () => import("@pkg/components/settings_content/settings_content")
);

export function SettingsModal(props: SettingsModalProps) {
  const { onClose } = props;
  useEffect(() => {
    const observer = fromEvent<KeyboardEvent>(window, "keydown", {
      capture: true,
    })
      .pipe(filter((e: KeyboardEvent) => e.key === "Escape"))
      .subscribe((e: KeyboardEvent) => {
        onClose?.();
      });

    return () => {
      observer.unsubscribe();
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <>
      <Mask onClick={onClose} />
      <div className="t1-settings-modal">
        <Suspense fallback={null}>
          <SettingsContent />
        </Suspense>
      </div>
    </>,
    document.getElementById("t1-modals")!
  );
}
