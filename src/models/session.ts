import { makeObservable, observable } from "mobx";

export class Session {
  title?: string;

  constructor() {
    makeObservable(this, {
      title: observable,
    });
  }

}
