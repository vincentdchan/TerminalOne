

export interface ActionPayload {
  extName: string;
  data: ActionData;
}

export interface ActionData {
  title: string;
  color?: string;
}

export interface GenerateActionsParams {
  currentDir: string;
}

export interface Extension {
  name: string;
  testFile?: string;
  generateActions: (params: GenerateActionsParams) => ActionData | void | undefined | Promise<ActionData | void | undefined>;
}
