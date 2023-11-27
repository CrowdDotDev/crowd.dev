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
  private readonly queue = CrowdQueue.INTEGRATION_STREAM_WORKER

  public constructor(
    sqsClient: SqsClient,
    redis: RedisClient,
    tracer: Tracer,
    unleash: UnleashClient | undefined,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(sqsClient, redis, tracer, unleash, priorityLevelCalculationContextLoader, parentLog)
  }

  public override async init(): Promise<void> {
    await super.init([INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS])
  }

  public async checkStreams() {
    await this.sendMessage(
      this.queue,
      undefined,
      'global',
      new CheckStreamsQueueMessage(),
      'global',
      undefined,
      QueuePriorityLevel.GLOBAL,
    )
  }

  public async continueProcessingRunStreams(
    tenantId: string,
    platform: string,
    runId: string,
  ): Promise<void> {
    await this.sendMessage(
      this.queue,
      tenantId,
      runId,
      new ContinueProcessingRunStreamsQueueMessage(runId),
    )
  }

  public async triggerStreamProcessing(
    tenantId: string,
    platform: string,
    streamId: string,
  ): Promise<void> {
    await this.sendMessage(
      this.queue,
      tenantId,
      generateUUIDv1(),
      new ProcessStreamQueueMessage(streamId),
    )
  }

  public async triggerWebhookProcessing(
    tenantId: string,
    platform: string,
    webhookId: string,
  ): Promise<void> {
    await this.sendMessage(
      this.queue,
      tenantId,
      generateUUIDv1(),
      new ProcessWebhookStreamQueueMessage(webhookId),
    )
  }
}
