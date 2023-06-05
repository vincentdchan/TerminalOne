import { SessionManager } from "./session_manager";
import { BehaviorSubject, Subscription, map } from "rxjs";

export class AppState {
  sessionManager = new SessionManager();
  showFileExplorer$ = new BehaviorSubject<boolean>(false);
  showGiftBox$ = new BehaviorSubject<boolean>(false);
  currentDir$ = new BehaviorSubject<string | undefined>(undefined);

  constructor() {
    let lastSubscription: Subscription | undefined;
    this.sessionManager.activeSession$.subscribe((session) => {
      lastSubscription?.unsubscribe();

      lastSubscription = session?.cwd$.subscribe((cwd) => {
        this.currentDir$.next(cwd);
      });
    });
  }

  toggleShowFileExplorer() {
    this.showFileExplorer$.next(!this.showFileExplorer$.value);
  }

  toggleShowGiftBox() {
    this.showGiftBox$.next(!this.showGiftBox$.value);
  }

  // currentDir$ = this.sessionManager.activeSession$.pipe(
  //   map((session) => {
  //     return session?.cwd$.value;
  //   })
  // );

}
