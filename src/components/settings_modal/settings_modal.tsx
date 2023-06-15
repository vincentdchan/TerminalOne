import ReactDOM from "react-dom";
import React, {
  memo,
  Suspense,
  lazy,
  useEffect,
  useCallback,
  useState,
} from "react";
import { fromEvent } from "rxjs";
import { filter } from "rxjs/operators";
import "./settings_modal.scss";

const Mask = memo((props: { onClick?: React.MouseEventHandler }) => {
  const { onClick } = props;
  const handleMaskClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute("data-tauri-drag-region")) {
        return;
      }
      onClick?.(e);
    },
    [onClick]
  );
  return (
    <div onClick={handleMaskClick} className="t1-settings-modal-mask">
      <div
        className="titlebar"
        {...({ "data-tauri-drag-region": true } as any)}
      ></div>
    </div>
  );
});

export interface SettingsModalProps {
  onClose?: () => void;
}

const SettingsContent = lazy(
  () => import("@pkg/components/settings_content/settings_content")
);

const MODAL_PADDING = 42;
const MODAL_MAX_WIDTH = 920;

export function SettingsModal(props: SettingsModalProps) {
  const { onClose } = props;
  useEffect(() => {
    const subscription = fromEvent<KeyboardEvent>(window, "keydown", {
      capture: true,
    })
      .pipe(filter((e: KeyboardEvent) => e.key === "Escape"))
      .subscribe(() => {
        onClose?.();
      });

    return () => subscription.unsubscribe();
  }, [onClose]);

  const [width, setWidth] = useState(0);

  const handleResize = useCallback(() => {
    let newWidth = window.innerWidth - MODAL_PADDING * 2;
    newWidth = Math.min(newWidth, MODAL_MAX_WIDTH);
    setWidth(newWidth);
  }, []);

  useEffect(() => {
    const subscription = fromEvent<Event>(window, "resize").subscribe(() => {
      handleResize();
    });

    handleResize();

    return () => subscription.unsubscribe();
  }, [handleResize]);

  const [animationLoaded, setAnimationLoaded] = useState(false);
  const handleAnimationEnd = useCallback(() => {
    setAnimationLoaded(true);
  }, [setAnimationLoaded]);

  return ReactDOM.createPortal(
    <>
      <Mask onClick={onClose} />
      <div
        className="t1-settings-modal"
        onAnimationEnd={handleAnimationEnd}
        style={{ width, bottom: MODAL_PADDING }}
      >
        {animationLoaded && (
          <Suspense fallback={null}>
            <SettingsContent />
          </Suspense>
        )}
      </div>
    </>,
    document.getElementById("t1-modals")!
  );
}
