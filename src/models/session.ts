import { makeObservable, observable } from "mobx";
import { mkTabId } from "@pkg/utils/id_helper";

export class Session {
  id: string;
  title?: string;
  cwd?: string;

  constructor() {
    this.id = mkTabId();
    makeObservable(this, {
      title: observable,
      cwd: observable,
    });
  }

}
