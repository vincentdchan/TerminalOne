import { invoke } from "@tauri-apps/api";

export async function store(obj: any) {
  await invoke('ui_store', { doc: obj });
}

export async function addFavoriteFolder(path: string) {
  await invoke('add_favorite_folder', { path });
}

export async function removeFavoriteFolder(path: string) {
  await invoke('remove_favorite_folder', { path });
}

export interface FavoriteFolderData {
  _id: string,
  path: string,
}

export async function getAllFavoriteFolders(): Promise<FavoriteFolderData[]> {
  return await invoke('get_all_favorite_folders');
}
