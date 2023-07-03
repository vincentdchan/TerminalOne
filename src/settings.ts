
export interface Settings {
  terminal: TerminalSettings;
  app: AppSettings;
}

export interface TerminalSettings {
  "font-size": number;
  scrollback: number;
}

export interface AppSettings {
  "auto-update": boolean;
}
