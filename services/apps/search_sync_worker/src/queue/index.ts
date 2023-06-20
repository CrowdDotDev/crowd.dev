import { OpenSearchService } from '@/service/opensearch.service'
import { MemberSyncService } from '@/service/member.sync.service'
import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueReceiver } from '@crowd/sqs'
import { IQueueMessage, SearchSyncWorkerQueueMessageType } from '@crowd/types'

export class WorkerQueueReceiver extends SqsQueueReceiver {
  constructor(
    private readonly redisClient: RedisClient,
    client: SqsClient,
    private readonly dbConn: DbConnection,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
    maxConcurrentProcessing: number,
  ) {
    super(client, SEARCH_SYNC_WORKER_QUEUE_SETTINGS, maxConcurrentProcessing, parentLog)
  }

  private initMemberService(): MemberSyncService {
    return new MemberSyncService(
      this.redisClient,
      new DbStore(this.log, this.dbConn),
      this.openSearchService,
      this.log,
    )
  }

  protected override async processMessage<T extends IQueueMessage>(message: T): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const type = message.type as SearchSyncWorkerQueueMessageType
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = message as any

      switch (type) {
        // members
        case SearchSyncWorkerQueueMessageType.SYNC_MEMBER:
          await this.initMemberService().syncMember(data.memberId)
          break
        // this one taks a while so we can't relly on it to be finished in time and the queue message might pop up again so we immediatelly return
        case SearchSyncWorkerQueueMessageType.SYNC_TENANT_MEMBERS:
          this.initMemberService()
            .syncTenantMembers(data.tenantId)
            .catch((err) => this.log.error(err, 'Error while syncing tenant members!'))
          break
        // this one taks a while so we can't relly on it to be finished in time and the queue message might pop up again so we immediatelly return
        case SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_MEMBERS:
          this.initMemberService()
            .cleanupMemberIndex(data.tenantId)
            .catch((err) => this.log.error(err, 'Error while cleaning up tenant members!'))
          break
        case SearchSyncWorkerQueueMessageType.REMOVE_MEMBER:
          await this.initMemberService().removeMember(data.memberId)
          break

        // activities
        case SearchSyncWorkerQueueMessageType.SYNC_ACTIVITY:
          break
        case SearchSyncWorkerQueueMessageType.SYNC_TENANT_ACTIVITIES:
          break
        case SearchSyncWorkerQueueMessageType.CLEANUP_TENANT_ACTIVITIES:
          break
        case SearchSyncWorkerQueueMessageType.REMOVE_ACTIVITY:
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
