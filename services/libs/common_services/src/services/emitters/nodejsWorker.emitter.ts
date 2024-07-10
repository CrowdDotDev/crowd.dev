import { generateUUIDv1 } from '@crowd/common'
import { UnleashClient } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { CrowdQueue, NODEJS_WORKER_QUEUE_SETTINGS, SqsClient } from '@crowd/sqs'
import { Tracer } from '@crowd/tracing'
import {
  EagleEyeEmailDigestQueueMessage,
  QueuePriorityLevel,
  RefreshSampleDataQueueMessage,
  SendgridWebhookQueueMessage,
  StripeWebhookQueueMessage,
  WeeklyAnalyticsEmailQueueMessage,
} from '@crowd/types'
import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'

/* eslint-disable @typescript-eslint/no-explicit-any */

export class NodejsWorkerEmitter extends QueuePriorityService {
  public constructor(
    sqsClient: SqsClient,
    redis: RedisClient,
    tracer: Tracer,
    unleash: UnleashClient | undefined,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.NODEJS_WORKER,
      NODEJS_WORKER_QUEUE_SETTINGS,
      sqsClient,
      redis,
      tracer,
      unleash,
      priorityLevelCalculationContextLoader,
      parentLog,
    )
  }

  public async eagleEyeEmailDigest(tenantId: string, user: string): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new EagleEyeEmailDigestQueueMessage(tenantId, user),
    )
  }

  public async weeklyAnalyticsEmail(tenantId: string): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new WeeklyAnalyticsEmailQueueMessage(tenantId),
    )
  }

  public async stripeWebhook(event: any): Promise<void> {
    await this.sendMessage(
      undefined,
      generateUUIDv1(),
      new StripeWebhookQueueMessage(event),
      undefined,
      undefined,
      QueuePriorityLevel.SYSTEM,
    )
  }

  public async sendgridWebhook(event: any): Promise<void> {
    await this.sendMessage(
      undefined,
      generateUUIDv1(),
      new SendgridWebhookQueueMessage(event),
      undefined,
      undefined,
      QueuePriorityLevel.SYSTEM,
    )
  }

  public async refreshSampleData(): Promise<void> {
    await this.sendMessage(
      undefined,
      generateUUIDv1(),
      new RefreshSampleDataQueueMessage(),
      undefined,
      undefined,
      QueuePriorityLevel.SYSTEM,
    )
  }
}
