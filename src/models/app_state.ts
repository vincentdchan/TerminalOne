import { makeObservable, observable, action } from "mobx";
import { SessionManager } from "./session_manager";

export class AppState {
  sessionManager = new SessionManager();
  showFileExplorer = false;

  constructor() {
    makeObservable(this, {
      sessionManager: observable,
      showFileExplorer: observable,
      toggleShowFileExplorer: action,
    });
  }

  toggleShowFileExplorer() {
    this.showFileExplorer = !this.showFileExplorer;
  }

}
