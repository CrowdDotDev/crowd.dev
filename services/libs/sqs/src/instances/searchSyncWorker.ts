import { Logger } from '@crowd/logging'
import { SearchSyncWorkerQueueMessageType } from '@crowd/types'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueEmitter } from '..'

export class SearchSyncWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, SEARCH_SYNC_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerMemberSync(tenantId: string, memberId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, {
      type: SearchSyncWorkerQueueMessageType.SYNC_MEMBER,
      memberId,
    })
  }

  public async triggerTenantMembersSync(tenantId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, {
      type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_MEMBERS,
      tenantId,
    })
  }

  public async triggerRemoveMember(tenantId: string, memberId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, {
      type: SearchSyncWorkerQueueMessageType.REMOVE_MEMBER,
      memberId,
    })
  }

  public async triggerMemberCleanup(tenantId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, {
      type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_MEMBERS,
      tenantId,
    })
  }

  public async triggerActivitySync(tenantId: string, activityId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, {
      type: SearchSyncWorkerQueueMessageType.SYNC_ACTIVITY,
      activityId,
    })
  }

  public async triggerTenantActivitiesSync(tenantId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, {
      type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_ACTIVITIES,
      tenantId,
    })
  }

  public async triggerRemoveActivity(tenantId: string, activityId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, {
      type: SearchSyncWorkerQueueMessageType.REMOVE_ACTIVITY,
      activityId,
    })
  }

  public async triggerActivityCleanup(tenantId: string) {
    await this.sendMessage(`search-sync-${tenantId}`, {
      type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ACTIVITIES,
      tenantId,
    })
  }
}
