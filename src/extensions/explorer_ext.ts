import type { Extension } from "@pkg/models/extension";
import { isString } from "lodash-es";

const explorerExt: Extension = {
  name: "explorer",
  generateActions: async ({ currentDir }) => {
    let title: string = currentDir;
    const lastPart = currentDir.split("/").pop();
    if (isString(lastPart)) {
      title = lastPart;
    }

    return {
      title,
      color: "rgb(138, 206, 247)",
    };
  },
};

export default explorerExt;
