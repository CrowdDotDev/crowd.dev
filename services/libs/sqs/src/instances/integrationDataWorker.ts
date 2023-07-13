import { Logger } from '@crowd/logging'
import { INTEGRATION_DATA_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import { ProcessStreamDataQueueMessage } from '@crowd/types'

export class IntegrationDataWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerDataProcessing(tenantId: string, platform: string, dataId: string) {
    await this.sendMessage(
      `data-${tenantId}-${platform}`,
      new ProcessStreamDataQueueMessage(dataId),
      dataId,
    )
  }
}
