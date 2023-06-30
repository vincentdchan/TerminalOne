import { mkTabId } from "@pkg/utils/id_helper";
import { Subject, BehaviorSubject, skip } from "rxjs";
import type { AppState } from "./app_state";
import { invoke } from "@tauri-apps/api";
import { isUndefined, isString } from "lodash-es";
import { ActionPayload } from "./extension";
import { TerminalStatistic } from "@pkg/messages";

const FILE_PATTERN = /file:\/\/([^\/]+)(.+)/;
const MAX_STATISTICS = 100;

export class Session {
  id: string;
  title$ = new BehaviorSubject<string | undefined>(undefined);
  cwd$ = new BehaviorSubject<string | undefined>(undefined);
  actions$ = new BehaviorSubject<ActionPayload[]>([]);
  showSearchBox$ = new BehaviorSubject<boolean>(false);
  uiReady$ = new BehaviorSubject<boolean>(false);
  statisticsLength$ = new BehaviorSubject<number>(0);

  shellInput$ = new Subject<string>();
  ptyOutput$ = new Subject<Uint8Array>();
  fsChanged$ = new Subject<string[]>();
  termFocus$ = new Subject<void>();
  searchBoxFocus$ = new Subject<void>();
  searchNext$ = new Subject<string>();
  statisticsUpdated$ = new Subject<void>();

  #statistics: (TerminalStatistic | undefined)[] = [];

  constructor(public appState: AppState, public initPath?: string) {
    this.id = mkTabId();

    this.cwd$.pipe(skip(1)).subscribe(() => this.generateActions());
    this.actions$.pipe(skip(1)).subscribe((actions) => {
      const shouldWatch = actions.some((action) => action.data.watchDir);
      const path = this.cwd$.value;
      if (isUndefined(path)) {
        return;
      }
      invoke("terminal_set_options", {
        id: this.id,
        options: {
          path,
          watchDirs: shouldWatch,
        },
      });
    });

    this.fsChanged$.subscribe(async () => {
      const { extensionManager } = this.appState;
      const currentDir = this.cwd$.value;
      if (isUndefined(currentDir)) {
        return;
      }
      const actions = this.actions$.value;
      const next = await extensionManager.regenerateFsChangedActions(
        currentDir,
        [...actions]
      );
      this.actions$.next(next);
    });
  }

  get statistics() {
    return this.#statistics;
  }

  get lastStatistic() {
    return this.statistics[this.statistics.length - 1];
  }

  pushStatistic(statistic: TerminalStatistic | undefined) {
    if (!statistic && this.#statistics.length === 0) {
      return;
    }
    this.statistics.push(statistic);
    // limit to 100
    if (this.statistics.length > MAX_STATISTICS) {
      this.statistics.shift();
    }

    this.statisticsUpdated$.next();
    const newLen = this.statistics.length;
    if (newLen === this.statisticsLength$.value) {
      return;
    }
    this.statisticsLength$.next(newLen);
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

  setCwdRaw(cwd: string) {
    const testResult = FILE_PATTERN.exec(cwd);
    if (!testResult) {
      return;
    }
    const path = testResult[2];
    if (isString(path) && path !== this.cwd$.value) {
      this.cwd$.next(path);
    }
  }
}
