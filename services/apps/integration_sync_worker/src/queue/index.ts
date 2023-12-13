import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS,
  SqsClient,
  SqsPrioritizedQueueReciever,
} from '@crowd/sqs'
import { Span, SpanStatusCode, Tracer } from '@crowd/tracing'
import {
  AutomationSyncTrigger,
  IQueueMessage,
  IntegrationSyncWorkerQueueMessageType,
  QueuePriorityLevel,
} from '@crowd/types'
import { Client } from '@opensearch-project/opensearch'
import { MemberSyncService } from '../service/member.sync.service'
import { OpenSearchService } from '../service/opensearch.service'
import { OrganizationSyncService } from '../service/organization.sync.service'

export class WorkerQueueReceiver extends SqsPrioritizedQueueReciever {
  constructor(
    level: QueuePriorityLevel,
    client: SqsClient,
    private readonly dbConn: DbConnection,
    private readonly openSearchClient: Client,
    tracer: Tracer,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(
      level,
      client,
      INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS,
      maxConcurrentProcessing,
      tracer,
      parentLog,
    )
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

  public override async processMessage<T extends IQueueMessage>(message: T): Promise<void> {
    await this.tracer.startActiveSpan('ProcessMessage', async (span: Span) => {
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

        span.setStatus({
          code: SpanStatusCode.OK,
        })
      } catch (err) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: err,
        })

        this.log.error(err, 'Error while processing message!')
        throw err
      } finally {
        span.end()
      }
    })
  }
}
