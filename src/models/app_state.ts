import { SessionManager } from "./session_manager";
import ExtensionManager from "./extension_manager";
import { BehaviorSubject, Subject, Subscription, map } from "rxjs";
import { FileItem as FileItemModel, InitMessage } from "@pkg/messages";
import { List as ImmutableList } from "immutable";
import { invoke } from "@tauri-apps/api";
import { isBoolean, isNumber, isString, once, debounce } from "lodash-es";
import { objectToCamlCaseDeep } from "@pkg/utils/objects";
import * as uiStore from "@pkg/utils/ui_store";
import type { ThemeResponse } from "@pkg/messages";
import { StoreKeys } from "@pkg/constants";
import { type AppTheme } from "./app_theme";
import extensions from "@pkg/extensions";

export enum AppStatus {
  Loading,
  Ready,
}

export class AppState {
  #sessionManager = once(() => new SessionManager(this));

  get sessionManager(): SessionManager {
    return this.#sessionManager();
  }

  #extensionManager = once(() => new ExtensionManager(this, extensions));

  get extensionManager(): ExtensionManager {
    return this.#extensionManager();
  }

  homeDir$ = new BehaviorSubject<string | undefined>(undefined);
  showSettings$ = new BehaviorSubject<boolean>(false);
  showFileExplorer$ = new BehaviorSubject<boolean>(false);
  showGiftBox$ = new BehaviorSubject<boolean>(false);
  showOnboarding$ = new BehaviorSubject<boolean>(false);
  currentDir$ = new BehaviorSubject<string | undefined>(undefined);
  giftBoxActiveIndex$ = new BehaviorSubject<number>(0);
  favoriteDirsPath$ = new BehaviorSubject<ImmutableList<string>>(
    ImmutableList()
  );
  dirPathToFileItem = new Map<string, FileItemModel>();
  windowActive$ = new BehaviorSubject<boolean>(true);
  appStatus$ = new BehaviorSubject<AppStatus>(AppStatus.Loading);
  modalClosed$ = new Subject<void>();

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

    if (isBoolean(uiStores[StoreKeys.showFileExplorer])) {
      this.showFileExplorer$.next(uiStores[StoreKeys.showFileExplorer]);
    }

    if (isBoolean(uiStores[StoreKeys.showGiftBox])) {
      this.showGiftBox$.next(uiStores[StoreKeys.showGiftBox]);
    }

    if (isNumber(uiStores[StoreKeys.onboarding])) {
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
    const next = !this.showSettings$.value;
    this.showSettings$.next(next);
    if (!next) {
      this.modalClosed$.next();
    }
  }

  toggleShowFileExplorer() {
    const next = !this.showFileExplorer$.value;
    this.showFileExplorer$.next(next);
    uiStore.store({
      _id: StoreKeys.showFileExplorer,
      value: next,
    });
  }

  toggleShowGiftBox() {
    const next = !this.showGiftBox$.value;
    this.showGiftBox$.next(next);
    uiStore.store({
      _id: StoreKeys.showGiftBox,
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
