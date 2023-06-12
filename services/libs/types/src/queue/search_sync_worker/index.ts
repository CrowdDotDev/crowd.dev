import { IQueueMessage } from '..'

export enum SearchSyncWorkerQueueMessageType {
  SYNC_MEMBER = 'sync_member',
  SYNC_TENANT_MEMBERS = 'sync_tenant_members',
}

export class SyncMemberQueueMessage implements IQueueMessage {
  public readonly type: string = SearchSyncWorkerQueueMessageType.SYNC_MEMBER

  constructor(public readonly memberId: string) {}
}

export class SyncTenantMembersQueueMessage implements IQueueMessage {
  public readonly type: string = SearchSyncWorkerQueueMessageType.SYNC_TENANT_MEMBERS

  constructor(public readonly tenantId: string) {}
}
