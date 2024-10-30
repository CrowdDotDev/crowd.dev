import { Logger } from '@crowd/logging'
import { CrowdQueue, IQueue } from '@crowd/queue'
import { RedisClient } from '@crowd/redis'
import {
  AutomationSyncTrigger,
  IIntegrationSyncWorkerEmitter,
  IntegrationSyncWorkerQueueMessageType,
} from '@crowd/types'

import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'

export class IntegrationSyncWorkerEmitter
  extends QueuePriorityService
  implements IIntegrationSyncWorkerEmitter
{
  public constructor(
    client: IQueue,
    redis: RedisClient,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.INTEGRATION_SYNC_WORKER,
      client.getQueueChannelConfig(CrowdQueue.INTEGRATION_SYNC_WORKER),
      client,
      redis,
      priorityLevelCalculationContextLoader,
      parentLog,
    )
  }

  public async triggerSyncMarkedMembers(tenantId: string, integrationId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!integrationId) {
      throw new Error('integrationId is required!')
    }
    await this.sendMessage(
      tenantId,
      integrationId,
      {
        type: IntegrationSyncWorkerQueueMessageType.SYNC_ALL_MARKED_MEMBERS,
        tenantId,
        integrationId,
      },
      integrationId,
    )
  }

  public async triggerSyncMember(
    tenantId: string,
    integrationId: string,
    memberId: string,
    syncRemoteId: string,
  ): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!integrationId) {
      throw new Error('integrationId is required!')
    }

    if (!memberId) {
      throw new Error('memberId is required!')
    }

    if (!syncRemoteId) {
      throw new Error('syncRemoteId is required!')
    }

    await this.sendMessage(
      tenantId,
      memberId,
      {
        type: IntegrationSyncWorkerQueueMessageType.SYNC_MEMBER,
        tenantId,
        integrationId,
        memberId,
        syncRemoteId,
      },
      memberId,
    )
  }

  public async triggerOnboardAutomation(
    tenantId: string,
    integrationId: string,
    automationId: string,
    automationTrigger: AutomationSyncTrigger,
  ): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!automationId) {
      throw new Error('automationId is required!')
    }
    if (!integrationId) {
      throw new Error('integrationId is required!')
    }
    await this.sendMessage(
      tenantId,
      automationId,
      {
        type: IntegrationSyncWorkerQueueMessageType.ONBOARD_AUTOMATION,
        tenantId,
        integrationId,
        automationId,
        automationTrigger,
      },
      automationId,
    )
  }

  public async triggerSyncMarkedOrganizations(
    tenantId: string,
    integrationId: string,
  ): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!integrationId) {
      throw new Error('integrationId is required!')
    }
    await this.sendMessage(
      tenantId,
      integrationId,
      {
        type: IntegrationSyncWorkerQueueMessageType.SYNC_ALL_MARKED_ORGANIZATIONS,
        tenantId,
        integrationId,
      },
      integrationId,
    )
  }

  public async triggerSyncOrganization(
    tenantId: string,
    integrationId: string,
    organizationId: string,
    syncRemoteId: string,
  ): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!integrationId) {
      throw new Error('integrationId is required!')
    }

    if (!syncRemoteId) {
      throw new Error('syncRemoteId is required!')
    }

    await this.sendMessage(
      tenantId,
      organizationId,
      {
        type: IntegrationSyncWorkerQueueMessageType.SYNC_ORGANIZATION,
        tenantId,
        integrationId,
        organizationId,
        syncRemoteId,
      },
      organizationId,
    )
  }
}
