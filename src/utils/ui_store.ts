import { invoke } from "@tauri-apps/api";

export async function store(key: string, value: any) {
  await invoke('ui_store', { key, value });
}

export async function addFavoriteFolder(path: string) {
  await invoke('add_favorite_folder', { path });
}

export async function removeFavoriteFolder(path: string) {
  await invoke('remove_favorite_folder', { path });
}

export async function getAllFavoriteFolders(): Promise<string[]> {
  return await invoke('get_all_favorite_folders');
}
