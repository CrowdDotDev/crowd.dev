import { generateUUIDv1 } from '@crowd/common'
import { Logger } from '@crowd/logging'
import { CrowdQueue, IQueue } from '@crowd/queue'
import { RedisClient } from '@crowd/redis'
import {
  CheckStreamsQueueMessage,
  ContinueProcessingRunStreamsQueueMessage,
  ProcessStreamQueueMessage,
  ProcessWebhookStreamQueueMessage,
  QueuePriorityLevel,
} from '@crowd/types'

import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'

export class IntegrationStreamWorkerEmitter extends QueuePriorityService {
  public constructor(
    client: IQueue,
    redis: RedisClient,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.INTEGRATION_STREAM_WORKER,
      client.getQueueChannelConfig(CrowdQueue.INTEGRATION_STREAM_WORKER),
      client,
      redis,
      priorityLevelCalculationContextLoader,
      parentLog,
    )
  }

  public async checkStreams() {
    await this.sendMessage(
      undefined,
      'global',
      new CheckStreamsQueueMessage(),
      'global',
      undefined,
      QueuePriorityLevel.SYSTEM,
    )
  }

  public async continueProcessingRunStreams(
    tenantId: string,
    onboarding: boolean,
    platform: string,
    runId: string,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      runId,
      new ContinueProcessingRunStreamsQueueMessage(runId),
      undefined,
      { onboarding },
    )
  }

  public async triggerStreamProcessing(
    tenantId: string,
    platform: string,
    streamId: string,
    onboarding: boolean,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new ProcessStreamQueueMessage(streamId),
      undefined,
      { onboarding },
    )
  }

  public async triggerWebhookProcessing(
    tenantId: string,
    platform: string,
    webhookId: string,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new ProcessWebhookStreamQueueMessage(webhookId),
      undefined,
      { onboarding: true },
    )
  }
}
