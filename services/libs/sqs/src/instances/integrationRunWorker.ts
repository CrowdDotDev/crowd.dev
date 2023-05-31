import { Logger } from '@crowd/logging'
import { INTEGRATION_RUN_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import { StreamProcessedQueueMessage, GenerateRunStreamsRunQueueMessage } from '@crowd/types'

export class IntegrationRunWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_RUN_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async triggerRunProcessing(
    tenantId: string,
    platform: string,
    runId: string,
  ): Promise<void> {
    await this.sendMessage(`${tenantId}-${platform}`, new GenerateRunStreamsRunQueueMessage(runId))
  }

  public async streamProcessed(tenantId: string, platform: string, runId: string): Promise<void> {
    await this.sendMessage(`runs-${tenantId}-${platform}`, new StreamProcessedQueueMessage(runId))
  }
}
