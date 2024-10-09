export interface SharedState {
  reportDataModal: any | null;
}

export default () => ({
  reportDataModal: null,
} as SharedState);
