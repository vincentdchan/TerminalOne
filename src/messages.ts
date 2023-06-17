
export interface InitMessage {
  homeDir: string;
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
