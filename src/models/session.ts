import { makeObservable, observable } from "mobx";
import { mkTabId } from "@pkg/utils/id_helper";
import { Subject } from "rxjs";

export class Session {
  id: string;
  title?: string;
  cwd?: string;

  shellInput$ = new Subject<string>();

  constructor() {
    this.id = mkTabId();
    makeObservable(this, {
      title: observable,
      cwd: observable,
    });
  }

}
