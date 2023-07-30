
export function dynamicDebounce<T extends (...args: any[]) => void>(func: T): (delay: number, ...args: Parameters<T>) => void {
  let timerId: number;

  return function (this: unknown, delay: number, ...args: Parameters<T>) {
    if (timerId) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      func.apply(this, args);
      timerId = null as any;
    }, delay);
  };
}
