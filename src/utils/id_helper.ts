const a = "a".charCodeAt(0);
const z = "z".charCodeAt(0);

const A = "A".charCodeAt(0);
const Z = "Z".charCodeAt(0);

const n0 = "0".charCodeAt(0);
const n9 = "9".charCodeAt(0);

function insertCodeBetween(begin: number, end: number, candidates: string[]) {
  for (let i = begin; i <= end; i++) {
    candidates.push(String.fromCharCode(i));
  }
}

const candidates: string[] = [];
insertCodeBetween(a, z, candidates);
insertCodeBetween(A, Z, candidates);
insertCodeBetween(n0, n9, candidates);

function randomStr(count: number) {
  let result = "";
  for (let i = 0; i < count; i++) {
    const rand = (Math.random() * candidates.length) | 0;
    result += candidates[rand];
  }
  return result;
}

export function mkTabId(): string {
  return "Tab-" + randomStr(12);
}
