import { UnleashClient } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { CrowdQueue, INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS, SqsClient } from '@crowd/sqs'
import { Tracer } from '@crowd/tracing'
import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'
import {
  CheckStreamsQueueMessage,
  ContinueProcessingRunStreamsQueueMessage,
  ProcessStreamQueueMessage,
  ProcessWebhookStreamQueueMessage,
  QueuePriorityLevel,
} from '@crowd/types'
import { generateUUIDv1 } from '@crowd/common'

export class IntegrationStreamWorkerEmitter extends QueuePriorityService {
  public constructor(
    sqsClient: SqsClient,
    redis: RedisClient,
    tracer: Tracer,
    unleash: UnleashClient | undefined,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.INTEGRATION_STREAM_WORKER,
      INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
      sqsClient,
      redis,
      tracer,
      unleash,
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
