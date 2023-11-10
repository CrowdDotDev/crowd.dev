import { BatchProcessor } from '@crowd/common'
import { Tracer, Span, SpanStatusCode } from '@crowd/tracing'
import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { ActivitySyncService } from '../service/activity.sync.service'
import { MemberSyncService } from '../service/member.sync.service'
import { OpenSearchService } from '../service/opensearch.service'
import { OrganizationSyncService } from '../service/organization.sync.service'
import { RedisClient } from '@crowd/redis'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueReceiver } from '@crowd/sqs'
import { IQueueMessage, SearchSyncWorkerQueueMessageType } from '@crowd/types'

/* eslint-disable @typescript-eslint/no-explicit-any */
export class WorkerQueueReceiver extends SqsQueueReceiver {
  private readonly memberBatchProcessor: BatchProcessor<string>
  private readonly activityBatchProcessor: BatchProcessor<string>
  private readonly organizationBatchProcessor: BatchProcessor<string>

  constructor(
    private readonly redisClient: RedisClient,
    client: SqsClient,
    private readonly dbConn: DbConnection,
    private readonly openSearchService: OpenSearchService,
    tracer: Tracer,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(
      client,
      SEARCH_SYNC_WORKER_QUEUE_SETTINGS,
      maxConcurrentProcessing,
      tracer,
      parentLog,
      true,
      5 * 60,
      10,
    )

    this.memberBatchProcessor = new BatchProcessor(
      100,
      30,
      async (memberIds) => {
        const distinct = Array.from(new Set(memberIds))
        if (distinct.length > 0) {
          this.log.info({ batchSize: distinct.length }, 'Processing batch of members!')
          await this.initMemberService().syncMembers(distinct)
        }
      },
      async (memberIds, err) => {
        this.log.error(err, { memberIds }, 'Error while processing batch of members!')
      },
    )

    this.activityBatchProcessor = new BatchProcessor(
      200,
      30,
      async (activityIds) => {
        const distinct = Array.from(new Set(activityIds))
        if (distinct.length > 0) {
          this.log.info({ batchSize: distinct.length }, 'Processing batch of activities!')
          await this.initActivityService().syncActivities(distinct)
        }
      },
      async (activityIds, err) => {
        this.log.error(err, { activityIds }, 'Error while processing batch of activities!')
      },
    )

    this.organizationBatchProcessor = new BatchProcessor(
      20,
      30,
      async (organizationIds) => {
        const distinct = Array.from(new Set(organizationIds))
        if (distinct.length > 0) {
          this.log.info({ batchSize: distinct.length }, 'Processing batch of organizations!')
          await this.initOrganizationService().syncOrganizations(distinct)
        }
      },
      async (organizationIds, err) => {
        this.log.error(err, { organizationIds }, 'Error while processing batch of organizations!')
      },
    )
  }

  private initMemberService(): MemberSyncService {
    return new MemberSyncService(
      this.redisClient,
      new DbStore(this.log, this.dbConn),
      this.openSearchService,
      this.log,
    )
  }

  private initActivityService(): ActivitySyncService {
    return new ActivitySyncService(
      new DbStore(this.log, this.dbConn),
      this.openSearchService,
      this.log,
    )
  }

  private initOrganizationService(): OrganizationSyncService {
    return new OrganizationSyncService(
      new DbStore(this.log, this.dbConn),
      this.openSearchService,
      this.log,
    )
  }

  protected override async processMessage<T extends IQueueMessage>(message: T): Promise<void> {
    await this.tracer.startActiveSpan('ProcessMessage', async (span: Span) => {
      try {
        this.log.trace({ messageType: message.type }, 'Processing message!')

        const type = message.type as SearchSyncWorkerQueueMessageType
        const data = message as any

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
              this.initMemberService()
                .syncTenantMembers(data.tenantId)
                .catch((err) => this.log.error(err, 'Error while syncing tenant members!'))
            }

            break
          case SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION_MEMBERS:
            if (data.organizationId) {
              this.initMemberService()
                .syncOrganizationMembers(data.organizationId)
                .catch((err) => this.log.error(err, 'Error while syncing organization members!'))
            }

            break
          // this one taks a while so we can't relly on it to be finished in time and the queue message might pop up again so we immediatelly return
          case SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_MEMBERS:
            if (data.tenantId) {
              this.initMemberService()
                .cleanupMemberIndex(data.tenantId)
                .catch((err) => this.log.error(err, 'Error while cleaning up tenant members!'))
            }

            break
          case SearchSyncWorkerQueueMessageType.REMOVE_MEMBER:
            if (data.memberId) {
              await this.initMemberService().removeMember(data.memberId)
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
              this.initActivityService()
                .syncTenantActivities(data.tenantId)
                .catch((err) => this.log.error(err, 'Error while syncing tenant activities!'))
            }
            break
          case SearchSyncWorkerQueueMessageType.SYNC_ORGANIZATION_ACTIVITIES:
            if (data.organizationId) {
              this.initActivityService()
                .syncOrganizationActivities(data.organizationId)
                .catch((err) => this.log.error(err, 'Error while syncing organization activities!'))
            }
            break
          case SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ACTIVITIES:
            if (data.tenantId) {
              this.initActivityService()
                .cleanupActivityIndex(data.tenantId)
                .catch((err) => this.log.error(err, 'Error while cleaning up tenant activities!'))
            }
            break
          case SearchSyncWorkerQueueMessageType.REMOVE_ACTIVITY:
            if (data.activityId) {
              await this.initActivityService().removeActivity(data.activityId)
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
              this.initOrganizationService()
                .syncTenantOrganizations(data.tenantId)
                .catch((err) => this.log.error(err, 'Error while syncing tenant organizations!'))
            }
            break
          case SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ORGANIZATIONS:
            if (data.tenantId) {
              this.initOrganizationService()
                .cleanupOrganizationIndex(data.tenantId)
                .catch((err) => {
                  this.log.error(err, 'Error while cleaning up tenant organizations!')
                })
            }
            break
          case SearchSyncWorkerQueueMessageType.REMOVE_ORGANIZATION:
            if (data.organizationId) {
              await this.initOrganizationService().removeOrganization(data.organizationId)
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
