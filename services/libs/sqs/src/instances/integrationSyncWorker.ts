import { Logger } from '@crowd/logging'
import { IntegrationSyncWorkerQueueMessageType } from '@crowd/types'
import { INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueEmitter } from '..'

export class IntegrationSyncWorkerEmitter extends SqsQueueEmitter {
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
      `integration-sync-marked-members-${tenantId}`,
      {
        type: IntegrationSyncWorkerQueueMessageType.SYNC_ALL_MARKED_MEMBERS,
        tenantId,
        integrationId,
      },
      `integration-sync-marked-members-${integrationId}`,
    )
  }

  public async triggerSyncMember(
    tenantId: string,
    integrationId: string,
    memberId: string,
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

    await this.sendMessage(
      `integration-sync-member-${tenantId}`,
      {
        type: IntegrationSyncWorkerQueueMessageType.SYNC_MEMBER,
        tenantId,
        integrationId,
        memberId,
      },
      `integration-sync-member-${memberId}`,
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
      `integration-sync-marked-organizations-${tenantId}`,
      {
        type: IntegrationSyncWorkerQueueMessageType.SYNC_ALL_MARKED_ORGANIZATIONS,
        tenantId,
        integrationId,
      },
      `integration-sync-marked-organizations-${integrationId}`,
    )
  }

  public async triggerSyncOrganization(
    tenantId: string,
    integrationId: string,
    organizationId: string,
  ): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }
    if (!integrationId) {
      throw new Error('integrationId is required!')
    }

    await this.sendMessage(
      `integration-sync-organization-${tenantId}`,
      {
        type: IntegrationSyncWorkerQueueMessageType.SYNC_ORGANIZATION,
        tenantId,
        integrationId,
        organizationId,
      },
      `integration-sync-organization-${organizationId}`,
    )
  }
}
