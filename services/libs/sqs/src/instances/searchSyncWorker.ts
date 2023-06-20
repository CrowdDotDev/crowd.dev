import { Logger } from '@crowd/logging'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueEmitter } from '..'
import {
  CleanUpTenantMembersQueueMessage,
  RemoveMemberQueueMessage,
  SyncMemberQueueMessage,
  SyncTenantMembersQueueMessage,
} from '@crowd/types'

export class SearchSyncWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, SEARCH_SYNC_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerMemberSync(tenantId: string, memberId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, new SyncMemberQueueMessage(memberId))
  }

  public async triggerTenantMembersSync(tenantId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, new SyncTenantMembersQueueMessage(tenantId))
  }

  public async triggerRemoveMember(tenantId: string, memberId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, new RemoveMemberQueueMessage(memberId))
  }

  public async triggerMemberCleanup(tenantId: string) {
    await this.sendMessage(
      `search-sync-${tenantId}`,
      new CleanUpTenantMembersQueueMessage(tenantId),
    )
  }
}
