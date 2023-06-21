export interface ActionPayload {
  extName: string;
  data: ActionData;
}

export interface ActionMenuItem {
  key: string;
  command: string;
  title?: string;
}

export interface ActionMenuDivider {
  type: "divider";
}

export function isDivider(item: any): item is ActionMenuDivider {
  return item.type === "divider";
}

export type ActionMenuItemType = ActionMenuItem | ActionMenuDivider;

export interface ActionData {
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
  | ActionData
  | void
  | undefined
  | Promise<ActionData | void | undefined>;

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
  onActionTrigger(
    handler: (params: ActionTriggerHandlerParams) =>
      | Promise<ActionMenuItemType[] | void | undefined>
      | ActionMenuItemType[]
      | undefined
      | void
  ): void;
}

export interface ActionTriggerHandlerParams extends GenerateActionsParams {
  data: ActionData;
}

export class ExtensionContext implements ExtensionContextIntf {
  resolveConfig?: ExtensionResolveConfig;
  resolveHandler?: (params: GenerateActionsParams) => HandleResolveResult;
  actionTriggerHandler?: (
    params: ActionTriggerHandlerParams
  ) =>
    | Promise<ActionMenuItemType[] | void | undefined>
    | ActionMenuItemType[]
    | undefined
    | void;

  constructor(public config: ExtensionConfig) {}

  onResolve(
    config: ExtensionResolveConfig,
    handler: (params: GenerateActionsParams) => HandleResolveResult
  ) {
    this.resolveConfig = config;
    this.resolveHandler = handler;
  }

  onActionTrigger(
    handler: (params: ActionTriggerHandlerParams) =>
      | Promise<ActionMenuItemType[] | void | undefined>
      | ActionMenuItemType[]
      | undefined
      | void
  ) {
    this.actionTriggerHandler = handler;
  }

  #cachedParams?: GenerateActionsParams | void | undefined;

  generateActions(params: GenerateActionsParams): HandleResolveResult {
    this.#cachedParams = params;
    return this.resolveHandler?.(params);
  }

  generateActionMenuItems(homeDir: string, data: ActionData):
    | Promise<ActionMenuItemType[] | void | undefined>
    | ActionMenuItemType[]
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
