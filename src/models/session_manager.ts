import {
  BehaviorSubject,
  Observable,
  combineLatestWith,
  map,
  take,
} from "rxjs";
import { Session } from "./session";

export class SessionManager {
  sessions$ = new BehaviorSubject<Session[]>([]);
  activeSessionIndex$ = new BehaviorSubject<number>(-1);

  newTab() {
    const session = new Session();
    const len = this.sessions$.value.length;
    this.sessions$.next([...this.sessions$.value, session]);

    this.activeSessionIndex$.next(len);
  }

  closeTab() {
    const activeSessionIndex = this.activeSessionIndex$.value;
    if (activeSessionIndex >= 0) {
      this.removeTab(activeSessionIndex);
    }
    const currentSessions = this.sessions$.value;
    if (activeSessionIndex >= currentSessions.length) {
      this.activeSessionIndex$.next(currentSessions.length - 1);
    }
  }

  moveTab(fromIndex: number, toIndex: number) {
    const next = [...this.sessions$.value];
    const tmp = next[fromIndex];
    next[fromIndex] = next[toIndex];
    next[toIndex] = tmp;
    this.sessions$.next(next);

    if (this.activeSessionIndex$.value === fromIndex) {
      this.activeSessionIndex$.next(toIndex);
    }
  }

  removeTab(index: number) {
    const next = [...this.sessions$.value];
    next.splice(index, 1);
    this.sessions$.next(next);

    const activeSessionIndex = this.activeSessionIndex$.value;
    if (activeSessionIndex >= next.length) {
      this.activeSessionIndex$.next(1);
    }
  }

  removeTabById(id: string) {
    const index = this.sessions$.value.findIndex((s) => s.id === id);
    if (index >= 0) {
      this.removeTab(index);
    }
  }

  activeSession$: Observable<Session | undefined> = this.sessions$.pipe(
    combineLatestWith(this.activeSessionIndex$),
    map(([sessions, activeSessionIndex]) => {
      return sessions[activeSessionIndex];
    })
  );

  executeCommand(cmd: string) {
    this.activeSession$.pipe(take(1)).subscribe((session) => {
      if (session) {
        session.shellInput$.next(cmd);
      }
    });
  }
}
