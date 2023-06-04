import { makeObservable, observable, action } from "mobx"
import { Session } from "./session";

export class SessionManager {
  sessions: Session[] = observable.array([]);
  activeSessionIndex = -1;

  constructor() {
    makeObservable(this, {
      sessions: observable,
      activeSessionIndex: observable,
      newTab: action,
      removeTab: action,
    });
  }

  newTab() {
    const session = new Session;
    const len = this.sessions.length;
    this.sessions.push(session);

    this.activeSessionIndex = len;
  }

  removeTab(index: number) {
    this.sessions.splice(index, 1);
    if (this.activeSessionIndex >= this.sessions.length) {
      this.activeSessionIndex -= 1;
    }
  }

  removeTabById(id: string) {
    const index = this.sessions.findIndex((s) => s.id === id);
    if (index >= 0) {
      this.removeTab(index);
    }
  }

}
