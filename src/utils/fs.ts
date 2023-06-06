import type { LsFileResponse, LsStatResponse } from "@pkg/messages";
import { invoke } from "@tauri-apps/api";

export async function ls(path: string): Promise<LsFileResponse> {
  const resp = await invoke("fs_ls", {
    path,
  }) as LsFileResponse;
  return resp;
}

export async function readAll(path: string): Promise<string> {
  const resp = await invoke("fs_read_all", {
    path,
  }) as string;
  return resp;
}

export async function stat(path: string): Promise<LsStatResponse> {
  const resp = await invoke("fs_stat", {
    path,
  }) as LsStatResponse;
  return resp;
}
