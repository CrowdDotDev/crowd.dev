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
  private readonly queue = CrowdQueue.INTEGRATION_RUN_WORKER

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
    await super.init([INTEGRATION_RUN_WORKER_QUEUE_SETTINGS])
  }

  public async checkRuns() {
    await this.sendMessage(
      this.queue,
      undefined,
      'global',
      new CheckRunsQueueMessage(),
      'global',
      undefined,
      QueuePriorityLevel.GLOBAL,
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
      this.queue,
      tenantId,
      integrationId,
      new StartIntegrationRunQueueMessage(integrationId, onboarding, isManualRun, manualSettings),
    )
  }

  public async triggerRunProcessing(
    tenantId: string,
    platform: string,
    runId: string,
    isManualRun?: boolean,
    manualSettings?: unknown,
  ): Promise<void> {
    await this.sendMessage(
      this.queue,
      tenantId,
      runId,
      new GenerateRunStreamsQueueMessage(runId, isManualRun, manualSettings),
      runId,
    )
  }

  public async streamProcessed(tenantId: string, platform: string, runId: string): Promise<void> {
    await this.sendMessage(this.queue, tenantId, runId, new StreamProcessedQueueMessage(runId))
  }
}
