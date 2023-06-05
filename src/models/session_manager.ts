import { BehaviorSubject, Observable, combineLatestWith, map } from "rxjs";
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
}
