import { isObject } from "lodash-es";

export function objectToCamlCaseDeep(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => objectToCamlCaseDeep(item));
  } else if (isObject(obj)) {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as any)[key];
        const newKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (typeof value === "object") {
          newObj[newKey] = objectToCamlCaseDeep(value);
        } else {
          newObj[newKey] = value;
        }
      }
    }
    return newObj;
  }
  return obj;
}
