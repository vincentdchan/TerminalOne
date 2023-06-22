import {
  type ActionPayload,
  type ExtensionConfig,
  type GenerateActionsParams,
  type ActionMenuItemType,
  ExtensionContext,
} from "./extension";
import type { AppState } from "./app_state";
import { isString } from "lodash-es";
import * as fs from "@pkg/utils/fs";

class ExtensionManager {
  extensions: ExtensionContext[] = [];
  extensionMap: Map<string, ExtensionContext> = new Map();

  constructor(public appState: AppState, extensions: ExtensionConfig[]) {
    extensions.forEach((extConfig) => {
      if (this.extensionMap.has(extConfig.name)) {
        console.error("Extension name duplicated: ", extConfig.name);
        return;
      }
      const ctx = new ExtensionContext(extConfig);
      this.extensionMap.set(ctx.name, ctx);
      this.extensions.push(ctx);
    });

    this.extensions.forEach((ext) => {
      ext.setup();
    });
  }

  async regenerateFsChangedActions(
    currentDir: string,
    existPayloads: ActionPayload[]
  ): Promise<ActionPayload[]> {
    const params: GenerateActionsParams = {
      homeDir: this.appState.homeDir$.value!,
      currentDir,
    };
    const nextPromises = existPayloads.map(async (actionPayload) => {
      if (!actionPayload.data.watchDir) {
        return actionPayload;
      }

      const ext = this.extensionMap.get(actionPayload.extName);
      if (!ext) {
        return actionPayload;
      }

      try {
        const actionData = await ext.generateActions(params);

        if (actionData) {
          return {
            extName: ext.name,
            data: actionData,
          };
        }
      } catch (err) {
        console.error("generate action error for: ", ext.name, err);
        return undefined;
      }
    });

    const nextPayloadsOptions = await Promise.all(nextPromises);
    const nextPayloads = nextPayloadsOptions.filter(
      (p) => p !== undefined
    ) as ActionPayload[];
    return nextPayloads;
  }

  async generateActions(currentDir: string): Promise<ActionPayload[]> {
    const resultMap: Map<string, ActionPayload> = new Map();

    const testFilesExts: ExtensionContext[] = [];
    const matchAllExts: ExtensionContext[] = [];

    for (const ext of this.extensions) {
      if (isString(ext.resolveConfig?.testFile)) {
        testFilesExts.push(ext);
      } else {
        matchAllExts.push(ext);
      }
    }

    const resp = await fs.batchTestFiles(
      currentDir,
      testFilesExts.map((ext) => ext.resolveConfig?.testFile!)
    );

    const params: GenerateActionsParams = {
      homeDir: this.appState.homeDir$.value!,
      currentDir,
    };

    let index = 0;
    for (const ft of resp) {
      if (ft === 0) {
        index++;
        continue;
      }
      const ext = testFilesExts[index];
      try {
        const actionData = await ext.generateActions(params);

        if (actionData) {
          resultMap.set(ext.name, {
            extName: ext.name,
            data: actionData,
          });
        }
      } catch (err) {
        console.error("generate action error for: ", ext.name, err);
      }
      index++;
    }

    for (const ext of matchAllExts) {
      try {
        const actionData = await ext.generateActions(params);
        if (actionData) {
          resultMap.set(ext.name, {
            extName: ext.name,
            data: actionData,
          });
        }
      } catch (err) {
        console.error("generate action error for: ", ext.name, "(all)", err);
      }
    }

    const result: ActionPayload[] = [];

    for (const ext of this.extensions) {
      const testResult = resultMap.get(ext.name);
      if (testResult) {
        result.push(testResult);
      }
    }

    return result;
  }
}

export default ExtensionManager;
