import { mkTabId } from "@pkg/utils/id_helper";
import { Subject, BehaviorSubject } from "rxjs";

export class Session {
  id: string;
  title$ = new BehaviorSubject<string | undefined>(undefined);
  cwd$ = new BehaviorSubject<string | undefined>(undefined);

  shellInput$ = new Subject<string>();

  constructor() {
    this.id = mkTabId();
  }

  setTitle(title: string) {
    this.title$.next(title);
  }

  setCwd(cwd: string) {
    this.cwd$.next(cwd);
  }

}
