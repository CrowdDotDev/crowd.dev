import { Logger } from '@crowd/logging'
import { SearchSyncWorkerQueueMessageType } from '@crowd/types'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueEmitter } from '..'

export class SearchSyncWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, SEARCH_SYNC_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerMemberSync(tenantId: string, memberId: string, force = false) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    if (force) {
      await this.sendMessage(new Date().getTime().toString(), {
        type: SearchSyncWorkerQueueMessageType.SYNC_MEMBER,
        memberId,
      })
    } else {
      await this.sendMessage(
        `search-sync-${tenantId}`,
        {
          type: SearchSyncWorkerQueueMessageType.SYNC_MEMBER,
          memberId,
        },
        `member-sync-${memberId}`,
      )
    }
  }

  public async triggerTenantMembersSync(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(
      `search-sync-${tenantId}`,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_MEMBERS,
        tenantId,
      },
      `sync-tenant-members-${tenantId}`,
    )
  }

  public async triggerRemoveMember(tenantId: string, memberId: string, force = false) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    if (force) {
      await this.sendMessage(new Date().getTime().toString(), {
        type: SearchSyncWorkerQueueMessageType.REMOVE_MEMBER,
        memberId,
      })
    } else {
      await this.sendMessage(
        `search-sync-${tenantId}`,
        {
          type: SearchSyncWorkerQueueMessageType.REMOVE_MEMBER,
          memberId,
        },
        `remove-member-${memberId}`,
      )
    }
  }

  public async triggerMemberCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(
      `search-sync-${tenantId}`,
      {
        type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_MEMBERS,
        tenantId,
      },
      `cleanup-tenant-members-${tenantId}`,
    )
  }

  public async triggerActivitySync(tenantId: string, activityId: string, force = false) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!activityId) {
      throw new Error('activityId is required!')
    }

    if (force) {
      await this.sendMessage(new Date().getTime().toString(), {
        type: SearchSyncWorkerQueueMessageType.SYNC_ACTIVITY,
        activityId,
      })
    } else {
      await this.sendMessage(
        `search-sync-${tenantId}`,
        {
          type: SearchSyncWorkerQueueMessageType.SYNC_ACTIVITY,
          activityId,
        },
        `activity-sync-${activityId}`,
      )
    }
  }

  public async triggerTenantActivitiesSync(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(
      `search-sync-${tenantId}`,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_ACTIVITIES,
        tenantId,
      },
      `sync-tenant-activities-${tenantId}`,
    )
  }

  public async triggerRemoveActivity(tenantId: string, activityId: string, force = false) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!activityId) {
      throw new Error('activityId is required!')
    }

    if (force) {
      await this.sendMessage(new Date().getTime().toString(), {
        type: SearchSyncWorkerQueueMessageType.REMOVE_ACTIVITY,
        activityId,
      })
    } else {
      await this.sendMessage(
        `search-sync-${tenantId}`,
        {
          type: SearchSyncWorkerQueueMessageType.REMOVE_ACTIVITY,
          activityId,
        },
        `remove-activity-${activityId}`,
      )
    }
  }

  public async triggerActivityCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(
      `search-sync-${tenantId}`,
      {
        type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ACTIVITIES,
        tenantId,
      },
      `cleanup-tenant-activities-${tenantId}`,
    )
  }

  public async triggerOrganizationSync(tenantId: string, organizationId: string, force = false) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    if (force) {
      await this.sendMessage(new Date().getTime().toString(), {
        type: SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION,
        tenantId,
        organizationId,
      })
    } else {
      await this.sendMessage(
        `search-sync-${tenantId}`,
        {
          type: SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION,
          tenantId,
          organizationId,
        },
        `organization-sync-${organizationId}`,
      )
    }
  }

  public async triggerTenantOrganizationSync(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(
      `search-sync-${tenantId}`,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_ORGANIZATIONS,
        tenantId,
      },
      `sync-tenant-organizations-${tenantId}`,
    )
  }

  public async triggerRemoveOrganization(tenantId: string, organizationId: string, force = false) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    if (force) {
      await this.sendMessage(new Date().getTime().toString(), {
        type: SearchSyncWorkerQueueMessageType.REMOVE_ORGANIZATION,
        organizationId,
      })
    } else {
      await this.sendMessage(
        `search-sync-${tenantId}`,
        {
          type: SearchSyncWorkerQueueMessageType.REMOVE_ORGANIZATION,
          organizationId,
        },
        `remove-organization-${organizationId}`,
      )
    }
  }

  public async triggerOrganizationCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(
      `search-sync-${tenantId}`,
      {
        type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ORGANIZATIONS,
        tenantId,
      },
      `cleanup-tenant-organizations-${tenantId}`,
    )
  }
}
