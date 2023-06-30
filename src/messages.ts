export interface InitMessage {
  homeDir: string;
  forceOnboarding: boolean;
  uiStores: Record<string, any>;
}

export interface ThemeResponse {
  name: string;
  jsonContent?: string;
}

export interface LsFileResponse {
  content: FileItem[];
}

export interface LsStatResponse {
  modifiedTime: number;
  accessedTime: number;
  createdTime: number;
}

export interface FileItem {
  filename: string;
  path: string;
  isDir: boolean;
}

export interface SpawnResult {
  output: string;
  success: boolean;
  code?: number;
}

export interface OpenContextMenuClickedMessage {
  id: string;
  key: string;
}

export interface TerminalStatistic {
  cpuUsage: number;
  memUsage: number;
}
