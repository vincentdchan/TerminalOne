import { SessionManager } from "./session_manager";
import { BehaviorSubject, Subscription, map } from "rxjs";
import { FileItem as FileItemModel, InitMessage } from "@pkg/messages";
import { List as ImmutableList } from "immutable";
import { invoke } from "@tauri-apps/api";
import { isBoolean, isNumber, isString, once, debounce } from "lodash-es";
import { objectToCamlCaseDeep } from "@pkg/utils/objects";
import * as uiStore from "@pkg/utils/ui_store";
import type { ThemeResponse } from "@pkg/messages";
import { type AppTheme } from "./app_theme";

const STORE_KEY_SHOW_EXPLORER = "showFileExplorer";
const STORE_KEY_SHOW_GIFT_BOX = "showGiftBox";
const STORE_KEY_ONBOARDING = "onboarding";

export enum AppStatus {
  Loading,
  Ready,
}

export class AppState {
  homeDir$ = new BehaviorSubject<string | undefined>(undefined);
  sessionManager = new SessionManager();
  showSettings$ = new BehaviorSubject<boolean>(false);
  showFileExplorer$ = new BehaviorSubject<boolean>(false);
  showGiftBox$ = new BehaviorSubject<boolean>(false);
  showOnboarding$ = new BehaviorSubject<boolean>(false);
  currentDir$ = new BehaviorSubject<string | undefined>(undefined);
  giftBoxActiveIndex$ = new BehaviorSubject<number>(0);
  favoriteDirsPath$ = new BehaviorSubject<ImmutableList<string>>(ImmutableList());
  dirPathToFileItem = new Map<string, FileItemModel>();
  windowActive$ = new BehaviorSubject<boolean>(true);
  appStatus$ = new BehaviorSubject<AppStatus>(AppStatus.Loading);

  theme$ = new BehaviorSubject<AppTheme | undefined>(undefined);

  constructor() {
    let lastSubscription: Subscription | undefined;
    this.sessionManager.activeSession$.subscribe((session) => {
      lastSubscription?.unsubscribe();

      if (!session) {
        this.currentDir$.next(undefined);
        return;
      }

      lastSubscription = session.cwd$.subscribe((cwd) => {
        this.currentDir$.next(cwd);
      });
    });
  }

  init = once(async () => {
    await Promise.all([this.#fetchTheme(), this.#fetchInitData()]);
  });

  prettyPath(path: string): string {
    const homeDir = this.homeDir$.value;
    if (!isString(homeDir)) {
      return path;
    }

    if (path.startsWith(homeDir)) {
      return "~" + path.slice(homeDir.length);
    }

    return path;
  }

  async #fetchTheme() {
    const themeResp: ThemeResponse = await invoke("get_a_theme");
    if (isString(themeResp.jsonContent)) {
      let themeContent = JSON.parse(themeResp.jsonContent) as AppTheme;
      themeContent = objectToCamlCaseDeep(themeContent);
      console.log("update theme:", themeContent);
      this.theme$.next(themeContent);
    }
  }

  async #fetchInitData() {
    const initData: InitMessage = await invoke("fetch_init_data");
    console.log("initData:", initData);
    const { homeDir, uiStores } = initData;
    this.homeDir$.next(homeDir);

    if (isBoolean(uiStores[STORE_KEY_SHOW_EXPLORER])) {
      this.showFileExplorer$.next(uiStores[STORE_KEY_SHOW_EXPLORER]);
    }

    if (isBoolean(uiStores[STORE_KEY_SHOW_GIFT_BOX])) {
      this.showGiftBox$.next(uiStores[STORE_KEY_SHOW_GIFT_BOX]);
    }

    if (isNumber(uiStores[STORE_KEY_ONBOARDING])) {
      this.appStatus$.next(AppStatus.Ready);
    } else {
      this.showOnboarding$.next(true);
    }
  }

  fetchFavoriteDirs = debounce(async () => {
    const data = await uiStore.getAllFavoriteFolders();

    const paths: string[] = [];

    for (const folderItem of data) {
      this.dirPathToFileItem.set(folderItem.path, {
        path: folderItem.path,
        isDir: true,
        filename: folderItem.path.split("/").pop() || "",
      });
      paths.push(folderItem.path);
    }

    this.favoriteDirsPath$.next(ImmutableList(paths));
  });

  toggleShowSettings() {
    this.showSettings$.next(!this.showSettings$.value);
  }

  toggleShowFileExplorer() {
    const next = !this.showFileExplorer$.value;
    this.showFileExplorer$.next(next);
    uiStore.store({
      _id: STORE_KEY_SHOW_EXPLORER,
      value: next,
    });
  }

  toggleShowGiftBox() {
    const next = !this.showGiftBox$.value;
    this.showGiftBox$.next(next);
    uiStore.store({
      _id: STORE_KEY_SHOW_GIFT_BOX,
      value: next,
    });
  }

  addOrRemoveFavoriteDir(dirModel: FileItemModel) {
    const { path } = dirModel;
    const favoriteDirs = this.favoriteDirsPath$.value;
    const index = favoriteDirs.indexOf(path);
    if (index >= 0) {
      this.favoriteDirsPath$.next(favoriteDirs.remove(index));
      this.dirPathToFileItem.delete(path);

      uiStore.removeFavoriteFolder(path);
    } else {
      this.dirPathToFileItem.set(path, dirModel);
      this.favoriteDirsPath$.next(favoriteDirs.push(path));

      uiStore.addFavoriteFolder(path);
    }
  }

  favoriteDirs$ = this.favoriteDirsPath$.pipe(
    map((paths) => {
      return paths
        .map((path) => this.dirPathToFileItem.get(path))
        .toArray()
        .filter((dir) => !!dir) as FileItemModel[];
    })
  );

  // currentDir$ = this.sessionManager.activeSession$.pipe(
  //   map((session) => {
  //     return session?.cwd$.value;
  //   })
  // );
}
