import { IQueueMessage } from '..'

export enum SearchSyncWorkerQueueMessageType {
  SYNC_MEMBER = 'sync_member',
}

export class SyncMemberQueueMessage implements IQueueMessage {
  public readonly type: string = SearchSyncWorkerQueueMessageType.SYNC_MEMBER

  constructor(public readonly tenantId: string, public readonly memberId: string) {}
}
