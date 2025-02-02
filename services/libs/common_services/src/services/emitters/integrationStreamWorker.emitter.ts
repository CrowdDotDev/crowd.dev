import { generateUUIDv1 } from '@crowd/common'
import { Logger } from '@crowd/logging'
import { CrowdQueue, IQueue } from '@crowd/queue'
import {
  CheckStreamsQueueMessage,
  ContinueProcessingRunStreamsQueueMessage,
  ProcessStreamQueueMessage,
  ProcessWebhookStreamQueueMessage,
  QueuePriorityLevel,
} from '@crowd/types'

import { QueuePriorityService } from '../priority.service'

export class IntegrationStreamWorkerEmitter extends QueuePriorityService {
  public constructor(client: IQueue, parentLog: Logger) {
    super(
      CrowdQueue.INTEGRATION_STREAM_WORKER,
      client.getQueueChannelConfig(CrowdQueue.INTEGRATION_STREAM_WORKER),
      client,
      parentLog,
    )
  }

  public async checkStreams() {
    await this.sendMessage(
      'global',
      new CheckStreamsQueueMessage(),
      'global',
      undefined,
      QueuePriorityLevel.SYSTEM,
    )
  }

  public async continueProcessingRunStreams(
    onboarding: boolean,
    platform: string,
    runId: string,
  ): Promise<void> {
    await this.sendMessage(runId, new ContinueProcessingRunStreamsQueueMessage(runId), undefined, {
      onboarding,
    })
  }

  public async triggerStreamProcessing(
    platform: string,
    streamId: string,
    onboarding: boolean,
  ): Promise<void> {
    await this.sendMessage(generateUUIDv1(), new ProcessStreamQueueMessage(streamId), undefined, {
      onboarding,
    })
  }

  public async triggerWebhookProcessing(platform: string, webhookId: string): Promise<void> {
    await this.sendMessage(
      generateUUIDv1(),
      new ProcessWebhookStreamQueueMessage(webhookId),
      undefined,
      { onboarding: true },
    )
  }
}
