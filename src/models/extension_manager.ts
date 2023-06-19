import { ActionPayload, Extension, GenerateActionsParams } from "./extension";
import type { AppState } from "./app_state";
import { isString } from "lodash-es";
import * as fs from "@pkg/utils/fs";

class ExtensionManager {
  extensionMap: Map<string, Extension> = new Map();

  constructor(public appState: AppState, public extensions: Extension[]) {
    this.extensions.forEach((ext) => {
      this.extensionMap.set(ext.name, ext);
    });
  }

  async generateActions(currentDir: string): Promise<ActionPayload[]> {
    const result: ActionPayload[] = [];

    const testFilesExts: Extension[] = [];
    const matchAllExts: Extension[] = [];

    for (const ext of this.extensions) {
      if (isString(ext.testFile)) {
        testFilesExts.push(ext);
      } else {
        matchAllExts.push(ext);
      }
    }

    const resp = await fs.batchTestFiles(
      currentDir,
      testFilesExts.map((ext) => ext.testFile!)
    );

    const params: GenerateActionsParams = { currentDir };

    let index = 0;
    for (const ft of resp) {
      if (ft === 0) {
        index++;
        continue;
      }
      const ext = testFilesExts[index];
      const actionData = await ext.generateActions(params);

      if (actionData) {
        result.push({
          extName: ext.name,
          data: actionData,
        });
      }
      index++;
    }

    for (const ext of matchAllExts) {
      const actionData = await ext.generateActions(params);
      if (actionData) {
        result.push({
          extName: ext.name,
          data: actionData,
        });
      }
    }

    return result;
  }
}

export default ExtensionManager;
