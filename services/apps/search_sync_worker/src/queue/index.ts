import { APP_IOC } from '../ioc_constants'
import { ActivitySyncService } from '../service/activity.sync.service'
import { MemberSyncService } from '../service/member.sync.service'
import { BatchProcessor } from '@crowd/common'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SQS_IOC, SqsClient, SqsQueueReceiver } from '@crowd/sqs'
import { IQueueMessage, SearchSyncWorkerQueueMessageType } from '@crowd/types'
import { inject, injectable } from 'inversify'
import { OrganizationSyncService } from '../service/organization.sync.service'
import { childIocContainer } from '@crowd/ioc'

/* eslint-disable @typescript-eslint/no-explicit-any */

@injectable()
export class WorkerQueueReceiver extends SqsQueueReceiver {
  private readonly memberBatchProcessor: BatchProcessor<string>
  private readonly activityBatchProcessor: BatchProcessor<string>
  private readonly organizationBatchProcessor: BatchProcessor<string>

  constructor(
    @inject(SQS_IOC.client)
    client: SqsClient,
    @inject(LOGGING_IOC.logger)
    parentLog: Logger,
    @inject(APP_IOC.maxConcurrentProcessing)
    maxConcurrentProcessing: number,
    @inject(APP_IOC.memberSyncService)
    memberSyncService: MemberSyncService,
    @inject(APP_IOC.activitySyncService)
    activitySyncService: ActivitySyncService,
    @inject(APP_IOC.organizationSyncService)
    organizationSyncService: OrganizationSyncService,
  ) {
    super(
      client,
      SEARCH_SYNC_WORKER_QUEUE_SETTINGS,
      maxConcurrentProcessing,
      parentLog,
      true,
      5 * 60,
      10,
    )

    this.memberBatchProcessor = new BatchProcessor(
      20,
      10,
      async (memberIds) => {
        const distinct = Array.from(new Set(memberIds))
        if (distinct.length > 0) {
          this.log.info({ batchSize: distinct.length }, 'Processing batch of members!')
          await memberSyncService.syncMembers(distinct)
        }
      },
      async (memberIds, err) => {
        this.log.error(err, { memberIds }, 'Error while processing batch of members!')
      },
    )

    this.activityBatchProcessor = new BatchProcessor(
      50,
      10,
      async (activityIds) => {
        const distinct = Array.from(new Set(activityIds))
        if (distinct.length > 0) {
          this.log.info({ batchSize: distinct.length }, 'Processing batch of activities!')
          await activitySyncService.syncActivities(distinct)
        }
      },
      async (activityIds, err) => {
        this.log.error(err, { activityIds }, 'Error while processing batch of activities!')
      },
    )

    this.organizationBatchProcessor = new BatchProcessor(
      5,
      10,
      async (organizationIds) => {
        const distinct = Array.from(new Set(organizationIds))
        if (distinct.length > 0) {
          this.log.info({ batchSize: distinct.length }, 'Processing batch of organizations!')
          await organizationSyncService.syncOrganizations(distinct)
        }
      },
      async (organizationIds, err) => {
        this.log.error(err, { organizationIds }, 'Error while processing batch of organizations!')
      },
    )
  }

  protected override async processMessage<T extends IQueueMessage>(message: T): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const type = message.type as SearchSyncWorkerQueueMessageType
      const data = message as any

      const requestContainer = childIocContainer()
      const childLogger = getChildLogger('message-processing', this.log, {
        messageType: message.type,
      })

      requestContainer.bind(LOGGING_IOC.logger).toConstantValue(childLogger)

      switch (type) {
        // members
        case SearchSyncWorkerQueueMessageType.SYNC_MEMBER:
          if (data.memberId) {
            await this.memberBatchProcessor.addToBatch(data.memberId)
          }

          break
        // this one taks a while so we can't relly on it to be finished in time and the queue message might pop up again so we immediatelly return
        case SearchSyncWorkerQueueMessageType.SYNC_TENANT_MEMBERS:
          if (data.tenantId) {
            const service = requestContainer.get<MemberSyncService>(APP_IOC.memberSyncService)
            service
              .syncTenantMembers(data.tenantId)
              .catch((err) => this.log.error(err, 'Error while syncing tenant members!'))
          }

          break
        case SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION_MEMBERS:
          if (data.organizationId) {
            const service = requestContainer.get<MemberSyncService>(APP_IOC.memberSyncService)

            service
              .syncOrganizationMembers(data.organizationId)
              .catch((err) => this.log.error(err, 'Error while syncing organization members!'))
          }

          break
        // this one taks a while so we can't relly on it to be finished in time and the queue message might pop up again so we immediatelly return
        case SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_MEMBERS:
          if (data.tenantId) {
            const service = requestContainer.get<MemberSyncService>(APP_IOC.memberSyncService)
            service
              .cleanupMemberIndex(data.tenantId)
              .catch((err) => this.log.error(err, 'Error while cleaning up tenant members!'))
          }

          break
        case SearchSyncWorkerQueueMessageType.REMOVE_MEMBER:
          if (data.memberId) {
            const service = requestContainer.get<MemberSyncService>(APP_IOC.memberSyncService)
            await service.removeMember(data.memberId)
          }
          break

        // activities
        case SearchSyncWorkerQueueMessageType.SYNC_ACTIVITY:
          if (data.activityId) {
            await this.activityBatchProcessor.addToBatch(data.activityId)
          }
          break
        case SearchSyncWorkerQueueMessageType.SYNC_TENANT_ACTIVITIES:
          if (data.tenantId) {
            const service = requestContainer.get<ActivitySyncService>(APP_IOC.activitySyncService)
            service
              .syncTenantActivities(data.tenantId)
              .catch((err) => this.log.error(err, 'Error while syncing tenant activities!'))
          }
          break
        case SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION_ACTIVITIES:
          if (data.organizationId) {
            const service = requestContainer.get<ActivitySyncService>(APP_IOC.activitySyncService)

            service
              .syncOrganizationActivities(data.organizationId)
              .catch((err) => this.log.error(err, 'Error while syncing organization activities!'))
          }
          break
        case SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ACTIVITIES:
          if (data.tenantId) {
            const service = requestContainer.get<ActivitySyncService>(APP_IOC.activitySyncService)

            service
              .cleanupActivityIndex(data.tenantId)
              .catch((err) => this.log.error(err, 'Error while cleaning up tenant activities!'))
          }
          break
        case SearchSyncWorkerQueueMessageType.REMOVE_ACTIVITY:
          if (data.activityId) {
            const service = requestContainer.get<ActivitySyncService>(APP_IOC.activitySyncService)

            await service.removeActivity(data.activityId)
          }
          break

        // organizations
        case SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION:
          if (data.organizationId) {
            await this.organizationBatchProcessor.addToBatch(data.organizationId)
          }
          break
        case SearchSyncWorkerQueueMessageType.SYNC_TENANT_ORGANIZATIONS:
          if (data.tenantId) {
            const service = requestContainer.get<OrganizationSyncService>(
              APP_IOC.organizationSyncService,
            )
            service
              .syncTenantOrganizations(data.tenantId)
              .catch((err) => this.log.error(err, 'Error while syncing tenant organizations!'))
          }
          break
        case SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ORGANIZATIONS:
          if (data.tenantId) {
            const service = requestContainer.get<OrganizationSyncService>(
              APP_IOC.organizationSyncService,
            )

            service
              .cleanupOrganizationIndex(data.tenantId)
              .catch((err) => this.log.error(err, 'Error while cleaning up tenant organizations!'))
          }
          break
        case SearchSyncWorkerQueueMessageType.REMOVE_ORGANIZATION:
          if (data.organizationId) {
            const service = requestContainer.get<OrganizationSyncService>(
              APP_IOC.organizationSyncService,
            )
            await service.removeOrganization(data.organizationId)
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
