export enum SyncMode {
  SYNCHRONOUS = 'synchronous',
  ASYNCHRONOUS = 'asynchronous',
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
