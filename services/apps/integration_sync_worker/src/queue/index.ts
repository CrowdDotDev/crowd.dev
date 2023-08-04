import { MemberSyncService } from '@/service/member.sync.service'
import { OpenSearchService } from '@/service/opensearch.service'
import { OrganizationSyncService } from '@/service/organization.sync.service'
import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueReceiver } from '@crowd/sqs'
import {
  AutomationSyncTrigger,
  IQueueMessage,
  IntegrationSyncWorkerQueueMessageType,
} from '@crowd/types'
import { Client } from '@opensearch-project/opensearch'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    client: SqsClient,
    private readonly dbConn: DbConnection,
    private readonly openSearchClient: Client,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(client, INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog)
  }

  private initMemberService(): MemberSyncService {
    return new MemberSyncService(
      new DbStore(this.log, this.dbConn),
      new OpenSearchService(this.log, this.openSearchClient),
      this.log,
    )
  }

  private initOrganizationService(): OrganizationSyncService {
    return new OrganizationSyncService(new DbStore(this.log, this.dbConn), this.log)
  }

  protected override async processMessage<T extends IQueueMessage>(message: T): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const type = message.type as IntegrationSyncWorkerQueueMessageType
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = message as any

      switch (type) {
        // members
        case IntegrationSyncWorkerQueueMessageType.SYNC_ALL_MARKED_MEMBERS:
          await this.initMemberService().syncAllMarkedMembers(data.tenantId, data.integrationId)

          break
        case IntegrationSyncWorkerQueueMessageType.SYNC_MEMBER:
          await this.initMemberService().syncMember(
            data.tenantId,
            data.integrationId,
            data.memberId,
            data.syncRemoteId,
          )
          break
        case IntegrationSyncWorkerQueueMessageType.SYNC_ORGANIZATION:
          await this.initOrganizationService().syncOrganization(
            data.tenantId,
            data.integrationId,
            data.organizationId,
            data.syncRemoteId,
          )
          break
        case IntegrationSyncWorkerQueueMessageType.SYNC_ALL_MARKED_ORGANIZATIONS:
          await this.initOrganizationService().syncAllMarkedOrganizations(
            data.tenantId,
            data.integrationId,
          )
          break
        case IntegrationSyncWorkerQueueMessageType.ONBOARD_AUTOMATION:
          if (data.automationTrigger === AutomationSyncTrigger.MEMBER_ATTRIBUTES_MATCH) {
            await this.initMemberService().syncAllFilteredMembers(
              data.tenantId,
              data.integrationId,
              data.automationId,
            )
          } else if (
            data.automationTrigger === AutomationSyncTrigger.ORGANIZATION_ATTRIBUTES_MATCH
          ) {
            const organizationIds =
              await this.initOrganizationService().syncAllFilteredOrganizations(
                data.tenantId,
                data.integrationId,
                data.automationId,
              )

            // also sync organization members if syncAllFilteredOrganizations return the ids
            while (organizationIds.length > 0) {
              const organizationId = organizationIds.shift()
              await this.initMemberService().syncOrganizationMembers(
                data.tenantId,
                data.integrationId,
                data.automationId,
                organizationId,
              )
            }
          } else {
            const errorMessage = `Unsupported trigger for onboard automation message!`
            this.log.error({ message }, errorMessage)
            throw new Error(errorMessage)
          }
          break

        default:
          throw new Error(`Unknown message type: ${message.type}`)
      }
    } catch (err) {
      this.log.error(err, 'Error while processing message!')
      throw err
    }
  }
}
