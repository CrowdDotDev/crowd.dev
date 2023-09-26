import { Logger } from '@crowd/logging'
import {
  AutomationSyncTrigger,
  IIntegrationSyncWorkerEmitter,
  IntegrationSyncWorkerQueueMessageType,
} from '@crowd/types'
import { INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueEmitter } from '..'

export class IntegrationSyncWorkerEmitter
  extends SqsQueueEmitter
  implements IIntegrationSyncWorkerEmitter
{
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerSyncMarkedMembers(tenantId: string, integrationId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!integrationId) {
      throw new Error('integrationId is required!')
    }
    await this.sendMessage(
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
