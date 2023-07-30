import { mkTabId } from "@pkg/utils/id_helper";
import { Subject, BehaviorSubject, skip } from "rxjs";
import type { AppState } from "./app_state";
import { invoke } from "@tauri-apps/api";
import { isUndefined, isString } from "lodash-es";
import { ToolbarButtonExtPayload } from "./extension";
import { TerminalStatistic } from "@pkg/messages";
import { List as ImmutableList } from "immutable";
import { dynamicDebounce } from "@pkg/utils/dynamic_debounce";

const FILE_PATTERN = /file:\/\/([^\/]+)(.+)/;
const MAX_STATISTICS = 100;

export class Session {
  id: string;
  title$ = new BehaviorSubject<string | undefined>(undefined);
  cwd$ = new BehaviorSubject<string | undefined>(undefined);
  toolbarButtons$ = new BehaviorSubject<ToolbarButtonExtPayload[]>([]);
  showSearchBox$ = new BehaviorSubject<boolean>(false);
  uiReady$ = new BehaviorSubject<boolean>(false);
  statistics$: BehaviorSubject<ImmutableList<TerminalStatistic>> =
    new BehaviorSubject(ImmutableList());
  activeToolbarButtonIndex$ = new BehaviorSubject<number>(-1);

  shellInput$ = new Subject<string>();
  ptyOutput$ = new Subject<string>();
  fsChanged$ = new Subject<string[]>();
  termFocus$ = new Subject<void>();
  searchBoxFocus$ = new Subject<void>();
  searchNext$ = new Subject<string>();

  generateActionsDuration = 0;

  constructor(public appState: AppState, public initPath?: string) {
    this.id = mkTabId();

    this.cwd$.pipe(skip(1)).subscribe((path) => {
      this.generateActions();
      if (isUndefined(path)) {
        return;
      }
      invoke("terminal_set_options", {
        id: this.id,
        options: {
          path,
          watchDirs: true,
        },
      });
    });

    this.fsChanged$.subscribe(() => {
      this.regenerateToolbarButtons(this.generateActionsDuration);
    });
  }

  private regenerateToolbarButtons = dynamicDebounce(async () => {
    const { extensionManager } = this.appState;
    const currentDir = this.cwd$.value;
    if (isUndefined(currentDir)) {
      return;
    }
    const actions = this.toolbarButtons$.value;
    const next = await extensionManager.regenerateFsChangedActions(
      currentDir,
      [...actions]
    );
    this.toolbarButtons$.next(next);
  });

  resetActiveToolbarButtonIndex() {
    if (this.activeToolbarButtonIndex$.value < 0) {
      return;
    }
    this.activeToolbarButtonIndex$.next(-1);
  }

  pushStatistic(statistic: TerminalStatistic) {
    if (!statistic && this.statistics$.value.count() === 0) {
      return;
    }

    let next = this.statistics$.value.push(statistic);
    // limit to 100
    if (next.count() > MAX_STATISTICS) {
      next = next.shift();
    }

    this.statistics$.next(next);
  }

  async generateActions() {
    const cwd = this.cwd$.value;
    if (isUndefined(cwd)) {
      return;
    }
    const startMark = performance.now();

    const { extensionManager } = this.appState;
    const actions = await extensionManager.generateActions(cwd);
    this.toolbarButtons$.next(actions);

    this.generateActionsDuration = performance.now() - startMark;
  }

  showSearchBox() {
    if (this.showSearchBox$.value) {
      this.searchBoxFocus$.next();
      return;
    }
    this.showSearchBox$.next(true);
  }

  closeSearchBox() {
    if (!this.showSearchBox$.value) {
      return;
    }
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
