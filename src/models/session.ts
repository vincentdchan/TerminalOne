import { mkTabId } from "@pkg/utils/id_helper";
import { Subject, BehaviorSubject, skip, map } from "rxjs";
import type { AppState } from "./app_state";
import { isUndefined } from "lodash-es";
import { ActionPayload } from "./extension";

export class Session {
  id: string;
  title$ = new BehaviorSubject<string | undefined>(undefined);
  cwd$ = new BehaviorSubject<string | undefined>(undefined);
  actions$ = new BehaviorSubject<ActionPayload[]>([]);

  shellInput$ = new Subject<string>();
  ptyOutput$ = new Subject<Uint8Array>();

  constructor(public appState: AppState) {
    this.id = mkTabId();

    this.cwd$.pipe(skip(1)).subscribe(() => this.generateActions());
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

  shouldWatchFiles$ = this.actions$.pipe(
    map((actions) => actions.some((action) => action.data.watchDir))
  );

  setTitle(title: string) {
    this.title$.next(title);
  }

  setCwd(cwd: string) {
    this.cwd$.next(cwd);
  }
}
