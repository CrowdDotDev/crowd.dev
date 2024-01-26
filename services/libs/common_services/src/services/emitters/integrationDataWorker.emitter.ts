import { CrowdQueue, INTEGRATION_DATA_WORKER_QUEUE_SETTINGS, SqsClient } from '@crowd/sqs'
import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'
import { RedisClient } from '@crowd/redis'
import { UnleashClient } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { ProcessStreamDataQueueMessage } from '@crowd/types'

export class IntegrationDataWorkerEmitter extends QueuePriorityService {
  public constructor(
    sqsClient: SqsClient,
    redis: RedisClient,
    unleash: UnleashClient | undefined,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.INTEGRATION_DATA_WORKER,
      INTEGRATION_DATA_WORKER_QUEUE_SETTINGS,
      sqsClient,
      redis,
      unleash,
      priorityLevelCalculationContextLoader,
      parentLog,
    )
  }

  public async triggerDataProcessing(
    tenantId: string,
    platform: string,
    dataId: string,
    onboarding: boolean,
  ) {
    await this.sendMessage(tenantId, dataId, new ProcessStreamDataQueueMessage(dataId), dataId, {
      onboarding,
    })
  }
}
