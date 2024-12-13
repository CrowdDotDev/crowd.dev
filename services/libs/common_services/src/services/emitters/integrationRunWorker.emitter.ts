import { Logger } from '@crowd/logging'
import { CrowdQueue, IQueue } from '@crowd/queue'
import { RedisClient } from '@crowd/redis'
import {
  CheckRunsQueueMessage,
  GenerateRunStreamsQueueMessage,
  QueuePriorityLevel,
  StartIntegrationRunQueueMessage,
  StreamProcessedQueueMessage,
} from '@crowd/types'

import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'

export class IntegrationRunWorkerEmitter extends QueuePriorityService {
  public constructor(
    client: IQueue,
    redis: RedisClient,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.INTEGRATION_RUN_WORKER,
      client.getQueueChannelConfig(CrowdQueue.INTEGRATION_RUN_WORKER),
      client,
      redis,
      priorityLevelCalculationContextLoader,
      parentLog,
    )
  }

  public async checkRuns() {
    await this.sendMessage(
      undefined,
      'global',
      new CheckRunsQueueMessage(),
      'global',
      undefined,
      QueuePriorityLevel.SYSTEM,
    )
  }

  public async triggerIntegrationRun(
    tenantId: string,
    platform: string,
    integrationId: string,
    onboarding: boolean,
    isManualRun?: boolean,
    manualSettings?: unknown,
    additionalInfo?: unknown,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
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
    tenantId: string,
    platform: string,
    runId: string,
    onboarding: boolean,
    isManualRun?: boolean,
    manualSettings?: unknown,
    additionalInfo?: unknown,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      runId,
      new GenerateRunStreamsQueueMessage(runId, isManualRun, manualSettings, additionalInfo),
      runId,
      { onboarding },
    )
  }

  public async streamProcessed(
    tenantId: string,
    platform: string,
    runId: string,
    onboarding: boolean,
  ): Promise<void> {
    await this.sendMessage(tenantId, runId, new StreamProcessedQueueMessage(runId), undefined, {
      onboarding,
    })
  }
}
