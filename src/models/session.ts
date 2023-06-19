import { mkTabId } from "@pkg/utils/id_helper";
import { Subject, BehaviorSubject, skip } from "rxjs";
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

    this.cwd$.pipe(skip(1)).subscribe(async (cwd) => {
      if (isUndefined(cwd)) {
        return;
      }

      const { extensionManager } = this.appState;
      const actions = await extensionManager.generateActions(cwd);
      this.actions$.next(actions);
    });
  }

  setTitle(title: string) {
    this.title$.next(title);
  }

  setCwd(cwd: string) {
    this.cwd$.next(cwd);
  }

}
