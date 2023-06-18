import { useState, useEffect } from "react";
import { skip, type BehaviorSubject, type Observable } from "rxjs";

export function useBehaviorSubject<T = any>(observable: BehaviorSubject<T>): T {
  const [value, setValue] = useState(observable.value);

  useEffect(() => {
    const s = observable.pipe(skip(1)).subscribe(setValue);
    return () => s.unsubscribe();
  }, [observable]);

  return value;
}

export function useObservable<T = any>(observable: Observable<T>, initial: T): T {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const s = observable.subscribe(setValue);
    return () => s.unsubscribe();
  }, [observable]);

  return value;
}
