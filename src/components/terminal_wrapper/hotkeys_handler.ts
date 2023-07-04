import type { KeysSettings } from "@pkg/settings";
import { noop } from "lodash-es";
import isHotkey from "is-hotkey";

export interface TerminalProxy {
  sendTerminalData(data: string): Promise<void>;
  clearTerminal(): void;
}

interface HotKeyItem {
  tester: (e: KeyboardEvent) => boolean;
  handler: (terminal: TerminalProxy) => void;
}

const SEND_CODES_PREFIX = "send-hex-codes:";

function parseHexString(hex: string): number {
  // parse hex string starts with 0x
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
    return parseInt(hex, 16);
  }
  
  return parseInt(hex, 16);
}

class HotKeysHandler {
  #hotkeys: HotKeyItem[] = [];
  constructor(public keysSettings: KeysSettings) {
    const { bindings } = keysSettings;
    if (bindings) {
      for (const [key, value] of Object.entries(bindings)) {
        try {

          let handler: (terminal: TerminalProxy) => void = noop;

          if (value.startsWith(SEND_CODES_PREFIX)) {
            const sendCodes = value.slice(SEND_CODES_PREFIX.length);
            const hexSlices = sendCodes.split(",").map(s => parseHexString(s.trim()));
            handler = (terminal: TerminalProxy) => {
              terminal.sendTerminalData(String.fromCharCode(...hexSlices));
            }
          }

          this.#hotkeys.push({
            tester: isHotkey(key),
            handler,
          });
        } catch (err) {
          console.log("Error while parsing hotkey: ", key, value);
        }
      }
    }

    this.#hotkeys.push({
      tester: isHotkey("mod+k"),
      handler: (terminal: TerminalProxy) => {
        terminal.clearTerminal();
      }
    });
    // iterate from the end of the config
    this.#hotkeys.reverse();
  }

  handle(e: KeyboardEvent, terminal: TerminalProxy): boolean {
    for (const item of this.#hotkeys) {
      if (item.tester(e)) {
        item.handler(terminal);
        return false;
      }
    }

    return true;
  }
}

export default HotKeysHandler;
