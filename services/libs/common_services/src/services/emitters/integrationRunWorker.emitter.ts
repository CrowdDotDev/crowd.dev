import { CrowdQueue, INTEGRATION_RUN_WORKER_QUEUE_SETTINGS, SqsClient } from '@crowd/sqs'
import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'
import { RedisClient } from '@crowd/redis'
import { Tracer } from '@crowd/tracing'
import { UnleashClient } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import {
  CheckRunsQueueMessage,
  GenerateRunStreamsQueueMessage,
  QueuePriorityLevel,
  StartIntegrationRunQueueMessage,
  StreamProcessedQueueMessage,
} from '@crowd/types'

export class IntegrationRunWorkerEmitter extends QueuePriorityService {
  public constructor(
    sqsClient: SqsClient,
    redis: RedisClient,
    tracer: Tracer,
    unleash: UnleashClient | undefined,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.INTEGRATION_RUN_WORKER,
      INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
      sqsClient,
      redis,
      tracer,
      unleash,
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
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      integrationId,
      new StartIntegrationRunQueueMessage(integrationId, onboarding, isManualRun, manualSettings),
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
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      runId,
      new GenerateRunStreamsQueueMessage(runId, isManualRun, manualSettings),
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
