export enum PushMessages {
  PTY_OUTPUT = "pty-output",
  PTY_EXIT = "pty-exit",
  FS_CHANGED = "fs-changed",
  UPDATE_AVAILABLE = "update-available",
  CONTEXT_MENU_CLICKED = "context-menu-clicked",
}

export interface PtyResponse {
  id: string;
  data: string;
}

export enum StoreKeys {
  showFileExplorer = "showFileExplorer",
  showGiftBox = "showGiftBox",
  onboarding = "onboarding",
  collectUsageData = "collectUsageData",
  collectDiagnosticData = "collectDiagnosticData",
}

export interface FsChangedEvent {
  id: string;
  paths: string[];
}

export interface UpdateAvailableEvent {
  version: string;
  date: string;
  body?: string;
}
