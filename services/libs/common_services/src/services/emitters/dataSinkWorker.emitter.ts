import { generateUUIDv1 } from '@crowd/common'
import { Logger } from '@crowd/logging'
import { CrowdQueue, IQueue } from '@crowd/queue'
import { RedisClient } from '@crowd/redis'
import {
  CheckResultsQueueMessage,
  CreateAndProcessActivityResultQueueMessage,
  IActivityData,
  IQueueMessage,
  ProcessIntegrationResultQueueMessage,
  QueuePriorityLevel,
} from '@crowd/types'

import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'

export class DataSinkWorkerEmitter extends QueuePriorityService {
  public constructor(
    queueClient: IQueue,
    redis: RedisClient,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.DATA_SINK_WORKER,
      queueClient.getQueueChannelConfig(CrowdQueue.DATA_SINK_WORKER),
      queueClient,
      redis,
      priorityLevelCalculationContextLoader,
      parentLog,
    )
  }

  public async triggerResultProcessing(
    tenantId: string,
    platform: string,
    resultId: string,
    sourceId: string,
    onboarding: boolean,
    deduplicationId?: string,
  ) {
    await this.sendMessage(
      tenantId,
      sourceId,
      new ProcessIntegrationResultQueueMessage(resultId),
      deduplicationId || resultId,
      {
        onboarding,
      },
    )
  }

  public async createAndProcessActivityResult(
    tenantId: string,
    segmentId: string,
    integrationId: string,
    activity: IActivityData,
  ) {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new CreateAndProcessActivityResultQueueMessage(tenantId, segmentId, integrationId, activity),
      undefined,
      {
        onboarding: true,
      },
    )
  }

  public async checkResults() {
    await this.sendMessage(
      undefined,
      'global',
      new CheckResultsQueueMessage(),
      'global',
      undefined,
      QueuePriorityLevel.SYSTEM,
    )
  }

  public sendMessagesBatch<T extends IQueueMessage>(
    messages: {
      tenantId: string
      payload: T
      groupId: string
      deduplicationId?: string
      id?: string
    }[],
  ): Promise<void> {
    return super.sendMessages(messages)
  }
}
