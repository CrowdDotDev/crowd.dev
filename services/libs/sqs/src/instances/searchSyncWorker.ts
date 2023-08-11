import { Logger } from '@crowd/logging'
import { SearchSyncWorkerQueueMessageType } from '@crowd/types'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueEmitter } from '..'

export class SearchSyncWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, SEARCH_SYNC_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerMemberSync(tenantId: string, memberId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.sendMessage(
      memberId,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_MEMBER,
        memberId,
      },
      memberId,
    )
  }

  public async triggerTenantMembersSync(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(tenantId, {
      type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_MEMBERS,
      tenantId,
    })
  }

  public async triggerRemoveMember(tenantId: string, memberId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.sendMessage(memberId, {
      type: SearchSyncWorkerQueueMessageType.REMOVE_MEMBER,
      memberId,
    })
  }

  public async triggerMemberCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(tenantId, {
      type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_MEMBERS,
      tenantId,
    })
  }

  public async triggerActivitySync(tenantId: string, activityId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!activityId) {
      throw new Error('activityId is required!')
    }

    await this.sendMessage(
      activityId,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_ACTIVITY,
        activityId,
      },
      activityId,
    )
  }

  public async triggerTenantActivitiesSync(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(tenantId, {
      type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_ACTIVITIES,
      tenantId,
    })
  }

  public async triggerRemoveActivity(tenantId: string, activityId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!activityId) {
      throw new Error('activityId is required!')
    }

    await this.sendMessage(activityId, {
      type: SearchSyncWorkerQueueMessageType.REMOVE_ACTIVITY,
      activityId,
    })
  }

  public async triggerActivityCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(tenantId, {
      type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ACTIVITIES,
      tenantId,
    })
  }
}
