import { SessionManager } from "./session_manager";
import { BehaviorSubject, Subscription, combineLatestWith, map } from "rxjs";
import { FileItem as FileItemModel, InitMessage } from "@pkg/messages";
import { Set as ImmutableSet } from "immutable";
import { invoke } from "@tauri-apps/api";
import { isString, once } from "lodash-es";
import { objectToCamlCaseDeep } from "@pkg/utils/objects";
import type { ThemeResponse } from "@pkg/messages";
import { type AppTheme } from "./app_theme";

export class AppState {
  initData$ = new BehaviorSubject<InitMessage | undefined>(undefined);
  sessionManager = new SessionManager();
  showSettings$ = new BehaviorSubject<boolean>(false);
  showFileExplorer$ = new BehaviorSubject<boolean>(false);
  showGiftBox$ = new BehaviorSubject<boolean>(false);
  currentDir$ = new BehaviorSubject<string | undefined>(undefined);
  giftBoxActiveIndex$ = new BehaviorSubject<number>(0);
  favoriteDirsPath$ = new BehaviorSubject<ImmutableSet<string>>(ImmutableSet());
  dirPathToFileItem = new Map<string, FileItemModel>();
  windowActive$ = new BehaviorSubject<boolean>(true);

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
    this.initData$.next(initData);
  }

  // When initData and theme are both ready, we can say the app is ready
  appReady$ = this.initData$.pipe(
    combineLatestWith(this.theme$),
    map(([initData, theme]) => {
      return !!initData && !!theme;
    })
  );

  toggleShowSettings() {
    this.showSettings$.next(!this.showSettings$.value);
  }

  toggleShowFileExplorer() {
    this.showFileExplorer$.next(!this.showFileExplorer$.value);
  }

  toggleShowGiftBox() {
    this.showGiftBox$.next(!this.showGiftBox$.value);
  }

  addOrRemoveFavoriteDir(dirModel: FileItemModel) {
    const { path } = dirModel;
    const favoriteDirs = this.favoriteDirsPath$.value;
    if (favoriteDirs.has(path)) {
      this.favoriteDirsPath$.next(favoriteDirs.delete(path));
      this.dirPathToFileItem.delete(path);
    } else {
      this.dirPathToFileItem.set(path, dirModel);
      this.favoriteDirsPath$.next(favoriteDirs.add(path));
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
