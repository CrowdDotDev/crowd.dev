export enum SyncMode {
  SYNCHRONOUS = 'synchronous',
  ASYNCHRONOUS = 'asynchronous',
  USE_FEATURE_FLAG = 'use-feature-flag',
}

export interface ISearchSyncOptions {
  doSync: boolean
  mode: SyncMode
}

export enum SyncStatus {
  NEVER = 'never',
  ACTIVE = 'active',
  STOPPED = 'stopped',
}
