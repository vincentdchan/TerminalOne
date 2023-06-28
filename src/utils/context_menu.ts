import { PushMessages } from "@pkg/constants";
import { OpenContextMenuClickedMessage } from "@pkg/messages";
import { invoke } from "@tauri-apps/api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

let unlisten: UnlistenFn | undefined;

export function openContextMenu(
  record: Record<string, unknown>,
  handler: (key: string) => void
) {
  const id = record.id as string;
  invoke("open_context_menu", { req: record }); // ignore result
  listen(PushMessages.CONTEXT_MENU_CLICKED, (event) => {
    const msg = event.payload as OpenContextMenuClickedMessage;
    if (msg.id !== id) {
      return;
    }
    handler(msg.key);
  }).then((un) => {
    unlisten?.();  // remove previous listener
    unlisten = un;
  });
}
