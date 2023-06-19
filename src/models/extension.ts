export interface ActionPayload {
  extName: string;
  data: ActionData;
}

export interface ActionMenuItem {
  key: string;
  title: string;
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
  onTrigger?: () =>
    | Promise<ActionMenuItemType[] | void | undefined>
    | ActionMenuItemType[]
    | undefined
    | void;
}

export interface GenerateActionsParams {
  currentDir: string;
}

export interface Extension {
  name: string;
  testFile?: string;
  generateActions: (
    params: GenerateActionsParams
  ) => ActionData | void | undefined | Promise<ActionData | void | undefined>;
}
