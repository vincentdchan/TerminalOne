
export interface Settings {
  terminal: TerminalSettings;
  app: AppSettings;
  keys: KeysSettings;
  extensions: Record<string, unknown>,
}

export interface TerminalSettings {
  "font-size": number;
  scrollback: number;
}

export interface AppSettings {
  "auto-update": boolean;
}

export interface KeysSettings {
  bindings?: KeysBindingsSettings;
}

export interface KeysBindingsSettings {
  [key: string]: string;
}
