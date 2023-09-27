import { APP_IOC } from '@/ioc_constants'
import { MemberSyncService } from '@/service/member.sync.service'
import { OrganizationSyncService } from '@/service/organization.sync.service'
import { IOC, childIocContainer } from '@crowd/ioc'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import {
  INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS,
  SQS_IOC,
  SqsClient,
  SqsQueueReceiver,
} from '@crowd/sqs'
import {
  AutomationSyncTrigger,
  IQueueMessage,
  IntegrationSyncWorkerQueueMessageType,
} from '@crowd/types'
import { inject, injectable } from 'inversify'

@injectable()
export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    @inject(SQS_IOC.client)
    client: SqsClient,
    @inject(LOGGING_IOC.logger)
    parentLog: Logger,
    @inject(APP_IOC.maxConcurrentProcessing)
    maxConcurrentProcessing: number,
  ) {
    super(client, INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog)

    const ioc = IOC()
    ioc.get<MemberSyncService>(APP_IOC.memberSyncService)
    ioc.get<OrganizationSyncService>(APP_IOC.organizationSyncService)
  }

  protected override async processMessage<T extends IQueueMessage>(message: T): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const requestContainer = childIocContainer()
      const childLogger = getChildLogger('message-processing', this.log, {
        messageType: message.type,
      })

      requestContainer.bind(LOGGING_IOC.logger).toConstantValue(childLogger)

      const type = message.type as IntegrationSyncWorkerQueueMessageType
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = message as any

      switch (type) {
        // members
        case IntegrationSyncWorkerQueueMessageType.SYNC_ALL_MARKED_MEMBERS: {
          const service = requestContainer.get<MemberSyncService>(APP_IOC.memberSyncService)
          await service.syncAllMarkedMembers(data.tenantId, data.integrationId)

          break
        }

        case IntegrationSyncWorkerQueueMessageType.SYNC_MEMBER: {
          const service = requestContainer.get<MemberSyncService>(APP_IOC.memberSyncService)
          await service.syncMember(
            data.tenantId,
            data.integrationId,
            data.memberId,
            data.syncRemoteId,
          )
          break
        }

        case IntegrationSyncWorkerQueueMessageType.SYNC_ORGANIZATION: {
          const service = requestContainer.get<OrganizationSyncService>(
            APP_IOC.organizationSyncService,
          )
          await service.syncOrganization(
            data.tenantId,
            data.integrationId,
            data.organizationId,
            data.syncRemoteId,
          )
          break
        }

        case IntegrationSyncWorkerQueueMessageType.SYNC_ALL_MARKED_ORGANIZATIONS: {
          const service = requestContainer.get<OrganizationSyncService>(
            APP_IOC.organizationSyncService,
          )
          await service.syncAllMarkedOrganizations(data.tenantId, data.integrationId)
          break
        }

        case IntegrationSyncWorkerQueueMessageType.ONBOARD_AUTOMATION: {
          const memberSyncService = requestContainer.get<MemberSyncService>(
            APP_IOC.memberSyncService,
          )

          if (data.automationTrigger === AutomationSyncTrigger.MEMBER_ATTRIBUTES_MATCH) {
            await memberSyncService.syncAllFilteredMembers(
              data.tenantId,
              data.integrationId,
              data.automationId,
            )
          } else if (
            data.automationTrigger === AutomationSyncTrigger.ORGANIZATION_ATTRIBUTES_MATCH
          ) {
            const orgSyncService = requestContainer.get<OrganizationSyncService>(
              APP_IOC.organizationSyncService,
            )

            const organizationIds = await orgSyncService.syncAllFilteredOrganizations(
              data.tenantId,
              data.integrationId,
              data.automationId,
            )

            // also sync organization members if syncAllFilteredOrganizations return the ids
            while (organizationIds.length > 0) {
              const organizationId = organizationIds.shift()
              await memberSyncService.syncOrganizationMembers(
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
        }

        default:
          throw new Error(`Unknown message type: ${message.type}`)
      }
    } catch (err) {
      this.log.error(err, 'Error while processing message!')
      throw err
    }
  }
}
