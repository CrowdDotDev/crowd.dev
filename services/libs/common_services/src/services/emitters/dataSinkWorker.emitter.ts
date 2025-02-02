import { generateUUIDv1 } from '@crowd/common'
import { Logger } from '@crowd/logging'
import { CrowdQueue, IQueue } from '@crowd/queue'
import {
  CheckResultsQueueMessage,
  CreateAndProcessActivityResultQueueMessage,
  IActivityData,
  IQueueMessage,
  ProcessIntegrationResultQueueMessage,
  QueuePriorityLevel,
} from '@crowd/types'

import { QueuePriorityService } from '../priority.service'

export class DataSinkWorkerEmitter extends QueuePriorityService {
  public constructor(queueClient: IQueue, parentLog: Logger) {
    super(
      CrowdQueue.DATA_SINK_WORKER,
      queueClient.getQueueChannelConfig(CrowdQueue.DATA_SINK_WORKER),
      queueClient,

      parentLog,
    )
  }

  public async triggerResultProcessing(
    platform: string,
    resultId: string,
    sourceId: string,
    onboarding: boolean,
    deduplicationId?: string,
  ) {
    await this.sendMessage(
      sourceId,
      new ProcessIntegrationResultQueueMessage(resultId),
      deduplicationId || resultId,
      {
        onboarding,
      },
    )
  }

  public async createAndProcessActivityResult(
    segmentId: string,
    integrationId: string,
    activity: IActivityData,
  ) {
    await this.sendMessage(
      generateUUIDv1(),
      new CreateAndProcessActivityResultQueueMessage(segmentId, integrationId, activity),
      undefined,
      {
        onboarding: true,
      },
    )
  }

  public async checkResults() {
    await this.sendMessage(
      'global',
      new CheckResultsQueueMessage(),
      'global',
      undefined,
      QueuePriorityLevel.SYSTEM,
    )
  }

  public sendMessagesBatch<T extends IQueueMessage>(
    messages: {
      payload: T
      groupId: string
      deduplicationId?: string
      id?: string
    }[],
  ): Promise<void> {
    return super.sendMessages(messages)
  }
}
