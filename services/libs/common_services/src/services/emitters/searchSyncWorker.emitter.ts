import { Logger } from '@crowd/logging'
import { CrowdQueue, IQueue } from '@crowd/queue'
import { RedisClient } from '@crowd/redis'
import { SearchSyncWorkerQueueMessageType } from '@crowd/types'

import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'

export class SearchSyncWorkerEmitter extends QueuePriorityService {
  public constructor(
    client: IQueue,
    redis: RedisClient,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.SEARCH_SYNC_WORKER,
      client.getQueueChannelConfig(CrowdQueue.SEARCH_SYNC_WORKER),
      client,
      redis,
      priorityLevelCalculationContextLoader,
      parentLog,
    )
  }

  public async triggerMemberSync(
    tenantId: string,
    memberId: string,
    onboarding: boolean,
    segmentId?: string,
  ) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.sendMessage(
      tenantId,
      memberId,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_MEMBER,
        memberId,
        segmentId,
      },
      `${memberId}:${segmentId}`,
      {
        onboarding,
      },
    )
  }

  public async triggerOrganizationMembersSync(
    tenantId: string,
    organizationId: string,
    onboarding: boolean,
  ) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    if (!organizationId) {
      throw new Error('organizationId is required!')
    }
    await this.sendMessage(
      tenantId,
      organizationId,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION_MEMBERS,
        organizationId,
      },
      undefined,
      {
        onboarding,
      },
    )
  }

  public async triggerRemoveMember(tenantId: string, memberId: string, onboarding: boolean) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.sendMessage(
      tenantId,
      memberId,
      {
        type: SearchSyncWorkerQueueMessageType.REMOVE_MEMBER,
        memberId,
      },
      undefined,
      {
        onboarding,
      },
    )
  }

  public async triggerMemberCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(tenantId, tenantId, {
      type: SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_MEMBERS,
      tenantId,
    })
  }

  public async triggerOrganizationSync(
    tenantId: string,
    organizationId: string,
    onboarding: boolean,
    segmentId?: string,
  ) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.sendMessage(
      tenantId,
      organizationId,
      {
        type: SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION,
        organizationId,
        segmentId,
      },
      `${organizationId}:${segmentId}`,
      {
        onboarding,
      },
    )
  }

  public async triggerRemoveOrganization(
    tenantId: string,
    organizationId: string,
    onboarding: boolean,
  ) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.sendMessage(
      tenantId,
      organizationId,
      {
        type: SearchSyncWorkerQueueMessageType.REMOVE_ORGANIZATION,
        organizationId,
      },
      undefined,
      {
        onboarding,
      },
    )
  }

  public async triggerOrganizationCleanup(tenantId: string) {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    await this.sendMessage(
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
