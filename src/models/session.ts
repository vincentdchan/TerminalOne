import { makeObservable, observable } from "mobx";
import { mkTabId } from "@pkg/utils/id_helper";

export class Session {
  id: string;
  title?: string;

  constructor() {
    this.id = mkTabId();
    makeObservable(this, {
      title: observable,
    });
  }

}
