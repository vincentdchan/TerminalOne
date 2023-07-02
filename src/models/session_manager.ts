import {
  BehaviorSubject,
  Observable,
  combineLatestWith,
  map,
  take,
} from "rxjs";
import { Session } from "./session";
import { listen } from "@tauri-apps/api/event";
import { PushMessages, type PtyResponse, FsChangedEvent } from "@pkg/constants";
import type { AppState } from "./app_state";

export class SessionManager {
  sessionsMap = new Map<string, Session>();
  sessions$ = new BehaviorSubject<Session[]>([]);
  activeSessionIndex$ = new BehaviorSubject<number>(-1);

  constructor(public appState: AppState) {
    this.#listenPtyOutput();
    this.#listenFsChanged()
  }

  async #listenPtyOutput() {
    await listen(PushMessages.PTY_OUTPUT, (event) => {
      const resp = event.payload as PtyResponse;
      const session = this.sessionsMap.get(resp.id);
      const { data64 } = resp;
      const data = Uint8Array.from(atob(data64), (c) => c.charCodeAt(0));
      session?.ptyOutput$.next(data);
    });
  }

  async #listenFsChanged() {
    await listen(PushMessages.FS_CHANGED, (event) => {
      const resp = event.payload as FsChangedEvent;
      const session = this.sessionsMap.get(resp.id);
      session?.fsChanged$.next(resp.paths);
    })
  }

  newTab(initPath?: string): Session {
    const session = new Session(this.appState, initPath);
    this.sessionsMap.set(session.id, session);

    const len = this.sessions$.value.length;
    this.sessions$.next([...this.sessions$.value, session]);

    this.activeSessionIndex$.next(len);

    return session;
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

    const legacy = next[index];
    this.sessionsMap.delete(legacy.id);

    next.splice(index, 1);
    this.sessions$.next(next);

    const activeSessionIndex = this.activeSessionIndex$.value;
    if (activeSessionIndex >= next.length) {
      this.activeSessionIndex$.next(next.length - 1);
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

  focusActiveSession() {
    this.activeSession$.pipe(take(1)).subscribe((session) => {
      session?.termFocus$.next();
    });
  }
}
