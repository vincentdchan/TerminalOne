import { useEffect } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { PushMessages } from "@pkg/constants";

interface PtyExitPayload {
  id: string;
}

export function usePtyExit(handler: (id: string) => void) {

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    listen(PushMessages.PTY_EXIT, (event) => {
      const payload = event.payload as PtyExitPayload;
      handler(payload.id);
    }).then((fn: UnlistenFn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    }
  }, [handler]);
}
