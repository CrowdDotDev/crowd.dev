import { Logger } from '@crowd/logging'
import { CrowdQueue, IQueue } from '@crowd/queue'
import {
  CheckRunsQueueMessage,
  GenerateRunStreamsQueueMessage,
  QueuePriorityLevel,
  StartIntegrationRunQueueMessage,
  StreamProcessedQueueMessage,
} from '@crowd/types'

import { QueuePriorityService } from '../priority.service'

export class IntegrationRunWorkerEmitter extends QueuePriorityService {
  public constructor(client: IQueue, parentLog: Logger) {
    super(
      CrowdQueue.INTEGRATION_RUN_WORKER,
      client.getQueueChannelConfig(CrowdQueue.INTEGRATION_RUN_WORKER),
      client,
      parentLog,
    )
  }

  public async checkRuns() {
    await this.sendMessage(
      'global',
      new CheckRunsQueueMessage(),
      'global',
      undefined,
      QueuePriorityLevel.SYSTEM,
    )
  }

  public async triggerIntegrationRun(
    platform: string,
    integrationId: string,
    onboarding: boolean,
    isManualRun?: boolean,
    manualSettings?: unknown,
    additionalInfo?: unknown,
  ): Promise<void> {
    await this.sendMessage(
      integrationId,
      new StartIntegrationRunQueueMessage(
        integrationId,
        onboarding,
        isManualRun,
        manualSettings,
        additionalInfo,
      ),
      undefined,
      { onboarding },
    )
  }

  public async triggerRunProcessing(
    platform: string,
    runId: string,
    onboarding: boolean,
    isManualRun?: boolean,
    manualSettings?: unknown,
    additionalInfo?: unknown,
  ): Promise<void> {
    await this.sendMessage(
      runId,
      new GenerateRunStreamsQueueMessage(runId, isManualRun, manualSettings, additionalInfo),
      runId,
      { onboarding },
    )
  }

  public async streamProcessed(
    platform: string,
    runId: string,
    onboarding: boolean,
  ): Promise<void> {
    await this.sendMessage(runId, new StreamProcessedQueueMessage(runId), undefined, {
      onboarding,
    })
  }
}
