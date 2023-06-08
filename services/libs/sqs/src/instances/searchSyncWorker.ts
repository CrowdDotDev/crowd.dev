import { Logger } from '@crowd/logging'
import { SEARCH_SYNC_WORKER_QUEUE_SETTINGS, SqsClient, SqsQueueEmitter } from '..'
import { SyncMemberQueueMessage } from '@crowd/types'

export class SearchSyncWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, SEARCH_SYNC_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerMemberSync(tenantId: string, memberId: string) {
    await this.sendMessage(
      `search-sync-${tenantId}`,
      new SyncMemberQueueMessage(tenantId, memberId),
    )
  }
}
