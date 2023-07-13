import { Logger } from '@crowd/logging'
import { DATA_SINK_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

export class DataSinkWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, DATA_SINK_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerResultProcessing(tenantId: string, platform: string, resultId: string) {
    await this.sendMessage(
      `results-${tenantId}-${platform}`,
      new ProcessIntegrationResultQueueMessage(resultId),
      resultId,
    )
  }
}
