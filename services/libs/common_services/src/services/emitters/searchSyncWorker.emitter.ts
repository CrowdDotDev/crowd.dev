import { UnleashClient } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { CrowdQueue, SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient } from '@crowd/sqs'
import { Tracer } from '@crowd/tracing'
import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'
import { SearchSyncWorkerQueueMessageType } from '@crowd/types'

export class SearchSyncWorkerEmitter extends QueuePriorityService {
  private readonly queue = CrowdQueue.SEARCH_SYNC_WORKER

  public constructor(
    sqsClient: SqsClient,
    redis: RedisClient,
    tracer: Tracer,
    unleash: UnleashClient | undefined,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(sqsClient, redis, tracer, unleash, priorityLevelCalculationContextLoader, parentLog)
  }

  public override async init(): Promise<void> {
    await super.init([SEARCH_SYNC_WORKER_QUEUE_SETTINGS])
  }

  public async triggerMemberSync(tenantId: string, memberId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.sendMessage(
      this.queue,
      tenantId,
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
    await this.sendMessage(this.queue, tenantId, tenantId, {
      type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_MEMBERS,
      tenantId,
    })
  }

  public async triggerOrganizationMembersSync(tenantId: string, organizationId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    if (!organizationId) {
      throw new Error('organizationId is required!')
    }
    await this.sendMessage(this.queue, tenantId, organizationId, {
      type: SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION_MEMBERS,
      organizationId,
    })
  }

  public async triggerRemoveMember(tenantId: string, memberId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.sendMessage(this.queue, tenantId, memberId, {
      type: SearchSyncWorkerQueueMessageType.REMOVE_MEMBER,
      memberId,
    })
  }

  public async triggerMemberCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(this.queue, tenantId, tenantId, {
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
      this.queue,
      tenantId,
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
    await this.sendMessage(this.queue, tenantId, tenantId, {
      type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_ACTIVITIES,
      tenantId,
    })
  }

  public async triggerOrganizationActivitiesSync(tenantId: string, organizationId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    if (!organizationId) {
      throw new Error('organizationId is required!')
    }
    await this.sendMessage(this.queue, tenantId, organizationId, {
      type: SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION_ACTIVITIES,
      organizationId,
    })
  }

  public async triggerRemoveActivity(tenantId: string, activityId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!activityId) {
      throw new Error('activityId is required!')
    }

    await this.sendMessage(this.queue, tenantId, activityId, {
      type: SearchSyncWorkerQueueMessageType.REMOVE_ACTIVITY,
      activityId,
    })
  }

  public async triggerActivityCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(this.queue, tenantId, tenantId, {
      type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ACTIVITIES,
      tenantId,
    })
  }

  public async triggerOrganizationSync(tenantId: string, organizationId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.sendMessage(
      this.queue,
      tenantId,
      organizationId,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION,
        organizationId,
      },
      organizationId,
    )
  }

  public async triggerTenantOrganizationSync(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(
      this.queue,
      tenantId,
      tenantId,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_TENANT_ORGANIZATIONS,
        tenantId,
      },
      tenantId,
    )
  }

  public async triggerRemoveOrganization(tenantId: string, organizationId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.sendMessage(this.queue, tenantId, organizationId, {
      type: SearchSyncWorkerQueueMessageType.REMOVE_ORGANIZATION,
      organizationId,
    })
  }

  public async triggerOrganizationCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(
      this.queue,
      tenantId,
      tenantId,
      {
        type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ORGANIZATIONS,
        tenantId,
      },
      tenantId,
    )
  }
}
