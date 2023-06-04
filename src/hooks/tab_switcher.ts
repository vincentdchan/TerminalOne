import { useCallback, useEffect } from "react";
import { SessionManager } from "@pkg/models/session_manager";
import { runInAction } from "mobx";

const key1 = 49;
const key9 = 57;
const keyT = 84;

export function useTabSwitcher(sessionManager: SessionManager) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.metaKey && e.which >= key1 && e.which <= key9) {
      const index = e.which - key1;
      const session = sessionManager.sessions[index];
      if (session) {
        runInAction(() => {
          sessionManager.activeSessionIndex = index;
        });
      }
    } else if (e.metaKey && e.which === keyT) {
      sessionManager.newTab();
    }
  }, [sessionManager]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);

    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}
