export interface ActionPayload {
  extName: string;
  data: ActionData;
}

export interface ActionMenuItem {
  key: string;
  title: string;
}

export interface ActionData {
  title: string;
  color?: string;
  onTrigger?: () =>
    | Promise<ActionMenuItem[] | void | undefined>
    | ActionMenuItem[]
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
