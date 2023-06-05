export interface ThemeResponse {
  name: string;
  jsonContent?: string;
}

export interface LsFileResponse {
  content: FileItem[];
}

export interface FileItem {
  filename: string;
  path: string;
  isDir: boolean;
}
