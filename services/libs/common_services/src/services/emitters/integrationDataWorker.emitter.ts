import { CrowdQueue, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, SqsClient } from '@crowd/sqs'
import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'
import { RedisClient } from '@crowd/redis'
import { Tracer } from '@crowd/tracing'
import { UnleashClient } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { ProcessStreamDataQueueMessage } from '@crowd/types'

export class IntegrationDataWorkerEmitter extends QueuePriorityService {
  public constructor(
    sqsClient: SqsClient,
    redis: RedisClient,
    tracer: Tracer,
    unleash: UnleashClient | undefined,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.INTEGRATION_DATA_WORKER,
      INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
      sqsClient,
      redis,
      tracer,
      unleash,
      priorityLevelCalculationContextLoader,
      parentLog,
    )
  }

  public async triggerDataProcessing(tenantId: string, platform: string, dataId: string) {
    await this.sendMessage(tenantId, dataId, new ProcessStreamDataQueueMessage(dataId), dataId)
  }
}
