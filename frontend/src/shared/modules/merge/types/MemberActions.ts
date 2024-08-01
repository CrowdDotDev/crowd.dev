export enum MergeActionState {
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  ERROR = 'error',
}

export interface MergeAction {
  operationType: string;
  primaryId: string;
  secondaryId: string;
  state: MergeActionState;
}
