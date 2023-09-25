import { Logger } from '@crowd/logging'
import { INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS } from '../config'
import { SqsQueueEmitter } from '../queue'
import { SqsClient } from '../types'
import {
  CheckStreamsQueueMessage,
  ContinueProcessingRunStreamsQueueMessage,
  ProcessStreamQueueMessage,
  ProcessWebhookStreamQueueMessage,
} from '@crowd/types'
import { generateUUIDv1 } from '@crowd/common'

export class IntegrationStreamWorkerEmitter extends SqsQueueEmitter {
  constructor(client: SqsClient, parentLog: Logger) {
    super(client, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, parentLog)
  }

  public async checkStreams() {
    await this.sendMessage('global', new CheckStreamsQueueMessage())
  }

  public async continueProcessingRunStreams(
    tenantId: string,
    platform: string,
    runId: string,
  ): Promise<void> {
    await this.sendMessage(runId, new ContinueProcessingRunStreamsQueueMessage(runId))
  }

  public async triggerStreamProcessing(
    tenantId: string,
    platform: string,
    streamId: string,
  ): Promise<void> {
    await this.sendMessage(generateUUIDv1(), new ProcessStreamQueueMessage(streamId))
  }

  public async triggerWebhookProcessing(
    tenantId: string,
    platform: string,
    webhookId: string,
  ): Promise<void> {
    await this.sendMessage(generateUUIDv1(), new ProcessWebhookStreamQueueMessage(webhookId))
  }
}
