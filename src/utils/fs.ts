import type { LsFileResponse } from "@pkg/messages";
import { invoke } from "@tauri-apps/api";

export async function ls(path: string): Promise<LsFileResponse> {
  const resp = await invoke("fs_ls", {
    path,
  }) as LsFileResponse;
  return resp;
}

export async function read_all(path: string): Promise<string> {
  const resp = await invoke("fs_read_all", {
    path,
  }) as string;
  return resp;
}
