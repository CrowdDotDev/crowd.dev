import { UnleashClient } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { CrowdQueue, NODEJS_WORKER_QUEUE_SETTINGS, SqsClient } from '@crowd/sqs'
import { Tracer } from '@crowd/tracing'
import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'
import { NewActivityAutomationQueueMessage, NewMemberAutomationQueueMessage } from '@crowd/types'

export class NodejsWorkerEmitter extends QueuePriorityService {
  private readonly queue = CrowdQueue.NODEJS_WORKER

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
    await super.init([NODEJS_WORKER_QUEUE_SETTINGS])
  }

  public async processAutomationForNewActivity(
    tenantId: string,
    activityId: string,
    segmentId: string,
  ): Promise<void> {
    await this.sendMessage(
      this.queue,
      tenantId,
      `${activityId}--${segmentId}`,
      new NewActivityAutomationQueueMessage(tenantId, activityId, segmentId),
      `${activityId}--${segmentId}`,
    )
  }

  public async processAutomationForNewMember(tenantId: string, memberId: string): Promise<void> {
    await this.sendMessage(
      this.queue,
      tenantId,
      memberId,
      new NewMemberAutomationQueueMessage(tenantId, memberId),
      memberId,
    )
  }
}
