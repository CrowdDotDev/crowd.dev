import { Logger } from '@crowd/logging'
import { INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import { ProcessStreamQueueMessage } from '@crowd/types'

export class IntegrationStreamWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerStreamProcessing(
    tenantId: string,
    platform: string,
    streamId: string,
  ): Promise<void> {
    await this.sendMessage(
      `streams-${tenantId}-${platform}`,
      new ProcessStreamQueueMessage(streamId),
    )
  }
}
