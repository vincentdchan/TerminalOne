import { invoke } from "@tauri-apps/api";

export async function store(obj: any) {
  await invoke('ui_store', { doc: obj });
}
