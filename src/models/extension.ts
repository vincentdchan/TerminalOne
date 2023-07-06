import { Subject } from "rxjs";
import type { AppState } from "./app_state";

export interface ToolbarButtonExtPayload {
  extName: string;
  data: ToolbarButtonData;
}

export interface ToolbarButtonDropdownMenuItem {
  key: string;
  command?: string;
  title?: string;
  onClick?: () => void;
}

export interface ToolbarButtonDropdownMenuDivider {
  type: "divider";
}

export function isToolbarButtonDropdownMenuDivider(
  item: any
): item is ToolbarButtonDropdownMenuDivider {
  return item.type === "divider";
}

export type ToolbarButtonDropdownMenuItemType =
  | ToolbarButtonDropdownMenuItem
  | ToolbarButtonDropdownMenuDivider;

export interface ToolbarButtonData {
  title: string;
  color?: string;
  /**
   * If true, will watch the directory for changes.
   * If the directory is changed, the handler will be called again.
   */
  watchDir?: boolean;
}

export interface GenerateActionsParams {
  currentDir: string;
  homeDir: string;
}

export type HandleResolveResult =
  | ToolbarButtonData
  | void
  | undefined
  | Promise<ToolbarButtonData | void | undefined>;

export interface ExtensionResolveConfig {
  testFile?: string;
}

export interface ExtensionConfig {
  name: string;
  setup?: (context: ExtensionContextIntf) => void;
}

export interface ExtensionContextIntf {
  onResolve(
    config: ExtensionResolveConfig,
    handler: (params: GenerateActionsParams) => HandleResolveResult
  ): void;
  onToolbarButtonTrigger(
    handler: (
      params: ToolbarButtonTriggerHandlerParams
    ) =>
      | Promise<ToolbarButtonDropdownMenuItemType[] | void | undefined>
      | ToolbarButtonDropdownMenuItemType[]
      | undefined
      | void
  ): void;
  getFavoriteDirsPath(): Promise<string[]>;
  addOrRemoveFavoriteDirByPath(path: string): void;
}

export interface ToolbarButtonTriggerHandlerParams extends GenerateActionsParams {
  data: ToolbarButtonData;
}

export class ExtensionContext implements ExtensionContextIntf {
  resolveConfig?: ExtensionResolveConfig;
  resolveHandler?: (params: GenerateActionsParams) => HandleResolveResult;
  actionTriggerHandler?: (
    params: ToolbarButtonTriggerHandlerParams
  ) =>
    | Promise<ToolbarButtonDropdownMenuItemType[] | void | undefined>
    | ToolbarButtonDropdownMenuItemType[]
    | undefined
    | void;

  #appState: AppState;

  constructor(appState: AppState, public config: ExtensionConfig) {
    this.#appState = appState;
  }

  onResolve(
    config: ExtensionResolveConfig,
    handler: (params: GenerateActionsParams) => HandleResolveResult
  ) {
    this.resolveConfig = config;
    this.resolveHandler = handler;
  }

  onToolbarButtonTrigger(
    handler: (
      params: ToolbarButtonTriggerHandlerParams
    ) =>
      | Promise<ToolbarButtonDropdownMenuItemType[] | void | undefined>
      | ToolbarButtonDropdownMenuItemType[]
      | undefined
      | void
  ) {
    this.actionTriggerHandler = handler;
  }

  #cachedParams?: GenerateActionsParams | void | undefined;

  async getFavoriteDirsPath(): Promise<string[]> {
    await this.#appState.fetchFavoriteDirs();
    return this.#appState.favoriteDirsPath$.value?.toArray() ?? [];
  }

  addOrRemoveFavoriteDirByPath(path: string) {
    this.#appState.addOrRemoveFavoriteDirByPath(path);
  }

  generateActions(params: GenerateActionsParams): HandleResolveResult {
    this.#cachedParams = params;
    return this.resolveHandler?.(params);
  }

  generateActionMenuItems(
    homeDir: string,
    data: ToolbarButtonData
  ):
    | Promise<ToolbarButtonDropdownMenuItemType[] | void | undefined>
    | ToolbarButtonDropdownMenuItemType[]
    | undefined
    | void {
    return this.actionTriggerHandler?.({
      homeDir,
      currentDir: this.#cachedParams!.currentDir,
      data,
    });
  }

  get name() {
    return this.config.name;
  }

  setup() {
    this.config.setup?.(this);
  }
}
