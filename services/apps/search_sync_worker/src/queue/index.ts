import { OpenSearchService } from '@/service/opensearch.service'
import { SyncService } from '@/service/sync.service'
import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueReceiver } from '@crowd/sqs'
import {
  IQueueMessage,
  RemoveMemberQueueMessage,
  SearchSyncWorkerQueueMessageType,
  SyncMemberQueueMessage,
  SyncTenantMembersQueueMessage,
} from '@crowd/types'

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

  protected override async processMessage(message: IQueueMessage): Promise<void> {
    try {
      this.log.trace({ messageType: message.type }, 'Processing message!')

      const service = new SyncService(
        this.redisClient,
        new DbStore(this.log, this.dbConn),
        this.openSearchService,
        this.log,
      )

      switch (message.type) {
        case SearchSyncWorkerQueueMessageType.SYNC_MEMBER:
          await service.syncMember((message as SyncMemberQueueMessage).memberId)
          break
        // this one taks a while so we can't relly on it to be finished in time and the queue message might pop up again so we immediatelly return
        case SearchSyncWorkerQueueMessageType.SYNC_TENANT_MEMBERS:
          service
            .syncTenantMembers((message as SyncTenantMembersQueueMessage).tenantId)
            .catch((err) => this.log.error(err, 'Error while syncing tenant members!'))
          break
        case SearchSyncWorkerQueueMessageType.REMOVE_MEMBER:
          await service.removeMember((message as RemoveMemberQueueMessage).memberId)
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
