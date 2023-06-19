export enum PushMessages {
  PTY_OUTPUT = "pty-output",
  PTY_EXIT = "pty-exit",
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
