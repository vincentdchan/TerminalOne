export enum PushMessages {
  PTY_OUTPUT = "pty-output",
  PTY_EXIT = "pty-exit",
  FS_CHANGED = "fs-changed",
}

export interface PtyResponse {
  id: string;
  data64: string;
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
