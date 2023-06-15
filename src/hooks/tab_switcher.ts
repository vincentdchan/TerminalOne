import { useCallback, useEffect } from "react";
import { SessionManager } from "@pkg/models/session_manager";
import { take } from "rxjs";

const key1 = 49;
const key9 = 57;

export function useTabSwitcher(sessionManager: SessionManager) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey && e.which >= key1 && e.which <= key9) {
        const index = e.which - key1;
        sessionManager.activeSession$
          .pipe(take(1))
          .subscribe((activeSession) => {
            if (
              activeSession &&
              index < sessionManager.sessions$.value.length
            ) {
              sessionManager.activeSessionIndex$.next(index);
            }
          });
      }
    },
    [sessionManager]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);
}
