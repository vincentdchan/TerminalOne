import { makeObservable, observable, action, computed } from "mobx";
import { SessionManager } from "./session_manager";

export class AppState {
  sessionManager = new SessionManager();
  showFileExplorer = false;

  constructor() {
    makeObservable(this, {
      sessionManager: observable,
      showFileExplorer: observable,
      toggleShowFileExplorer: action,
      currentDir: computed,
    });
  }

  toggleShowFileExplorer() {
    this.showFileExplorer = !this.showFileExplorer;
  }

  get currentDir(): string | undefined {
    const activeSection = this.sessionManager.sessions[this.sessionManager.activeSessionIndex];
    if (!activeSection) {
      return undefined;
    }
    return activeSection.cwd;
  }

}
