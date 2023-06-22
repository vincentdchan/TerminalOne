import { mkTabId } from "@pkg/utils/id_helper";
import { Subject, BehaviorSubject, skip, map } from "rxjs";
import type { AppState } from "./app_state";
import { invoke } from "@tauri-apps/api";
import { isUndefined } from "lodash-es";
import { ActionPayload } from "./extension";

export class Session {
  id: string;
  title$ = new BehaviorSubject<string | undefined>(undefined);
  cwd$ = new BehaviorSubject<string | undefined>(undefined);
  actions$ = new BehaviorSubject<ActionPayload[]>([]);
  showSearchBox$ = new BehaviorSubject<boolean>(false);

  shellInput$ = new Subject<string>();
  ptyOutput$ = new Subject<Uint8Array>();
  fsChanged$ = new Subject<string[]>();
  termFocus$ = new Subject<void>();
  searchBoxFocus$ = new Subject<void>();
  searchNext$ = new Subject<string>();

  constructor(public appState: AppState) {
    this.id = mkTabId();

    this.cwd$.pipe(skip(1)).subscribe(() => this.generateActions());
    this.actions$.pipe(skip(1)).subscribe((actions) => {
      const shouldWatch = actions.some((action) => action.data.watchDir);
      const path = this.cwd$.value;
      if (isUndefined(path)) {
        return;
      }
      invoke('terminal_set_options', {
        id: this.id,
        options: {
          path,
          watchDirs: shouldWatch,
        }
      })
    });

    this.fsChanged$.subscribe(async () => {
      const { extensionManager } = this.appState;
      const currentDir = this.cwd$.value;
      if (isUndefined(currentDir)) {
        return;
      }
      const actions = this.actions$.value;
      const next = await extensionManager.regenerateFsChangedActions(currentDir, [...actions]);
      this.actions$.next(next);
    });
  }

  async generateActions() {
    const cwd = this.cwd$.value;
    if (isUndefined(cwd)) {
      return;
    }

    const { extensionManager } = this.appState;
    const actions = await extensionManager.generateActions(cwd);
    this.actions$.next(actions);
  }

  showSearchBox() {
    if (this.showSearchBox$.value) {
      this.searchBoxFocus$.next();
      return;
    }
    this.showSearchBox$.next(true);
  }

  closeSearchBox() {
    this.showSearchBox$.next(false);
    this.termFocus$.next();
  }

  setTitle(title: string) {
    this.title$.next(title);
  }

  setCwd(cwd: string) {
    this.cwd$.next(cwd);
  }
}
