import { IS_DEV_ENV, IS_STAGING_ENV, IS_TEST_ENV, groupBy } from '@crowd/common'
import { Logger, getChildLogger } from '@crowd/logging'
import { CrowdQueue, IQueue, IQueueConfig, PrioritizedQueueEmitter } from '@crowd/queue'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IQueueMessage, IQueuePriorityCalculationContext, QueuePriorityLevel } from '@crowd/types'

export type QueuePriorityContextLoader = (
  tenantId: string,
) => Promise<IQueuePriorityCalculationContext>

export class QueuePriorityService {
  private readonly log: Logger
  private readonly cache: RedisCache

  private readonly emitter: PrioritizedQueueEmitter

  public constructor(
    public readonly queue: CrowdQueue,
    private readonly queueConfig: IQueueConfig,
    private readonly client: IQueue,
    redis: RedisClient,
    private readonly priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    this.log = getChildLogger(this.constructor.name, parentLog)
    this.cache = new RedisCache('queue-priority', redis, this.log)
    this.emitter = new PrioritizedQueueEmitter(this.client, this.queueConfig, this.log)
  }

  public isInitialized(): boolean {
    return this.emitter.isInitialized()
  }

  public async init(): Promise<void> {
    await this.emitter.init()
  }

  public async setMessageVisibilityTimeout(
    tenantId: string,
    receiptHandle: string,
    newVisibility: number,
  ): Promise<void> {
    const priorityLevel = await this.getPriorityLevel(
      tenantId,
      this.priorityLevelCalculationContextLoader,
    )

    return this.emitter.setMessageVisibilityTimeout(receiptHandle, newVisibility, priorityLevel)
  }

  public async sendMessages<T extends IQueueMessage>(
    messages: {
      tenantId: string
      payload: T
      groupId: string
      deduplicationId?: string
      id?: string
    }[],
  ): Promise<void> {
    const grouped = groupBy(messages, (m) => m.tenantId)

    for (const tenantId of Array.from(grouped.keys())) {
      const priorityLevel = await this.getPriorityLevel(
        tenantId,
        this.priorityLevelCalculationContextLoader,
      )

      return this.emitter.sendMessages(
        grouped.get(tenantId).map((m) => {
          return { ...m, priorityLevel }
        }),
      )
    }
  }

  public async sendMessage<T extends IQueueMessage>(
    tenantId: string | undefined,
    groupId: string,
    message: T,
    deduplicationId?: string,
    priorityLevelContextOverride?: unknown,
    priorityLevelOverride?: QueuePriorityLevel,
  ): Promise<void> {
    let priorityLevel = priorityLevelOverride
    if (!priorityLevel) {
      priorityLevel = await this.getPriorityLevel(
        tenantId,
        this.priorityLevelCalculationContextLoader,
        priorityLevelContextOverride,
      )
    } else if (IS_DEV_ENV || IS_TEST_ENV || IS_STAGING_ENV) {
      priorityLevel = QueuePriorityLevel.NORMAL
    }

    return this.emitter.sendMessage(groupId, message, priorityLevel, deduplicationId)
  }

  private async getPriorityLevel(
    tenantId: string,
    loader: QueuePriorityContextLoader,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    override?: any,
  ): Promise<QueuePriorityLevel> {
    if (IS_DEV_ENV || IS_TEST_ENV || IS_STAGING_ENV) {
      return QueuePriorityLevel.NORMAL
    }

    const cached = await this.cache.get(tenantId)
    if (cached) {
      return cached as QueuePriorityLevel
    }

    let ctx = await loader(tenantId)
    if (override) {
      ctx = { ...ctx, ...override }
    }

    const priority = this.calculateQueuePriorityLevel(ctx)

    // cache for 5 minutes
    await this.cache.set(tenantId, priority, 5 * 60)

    return priority
  }

  private calculateQueuePriorityLevel(ctx: IQueuePriorityCalculationContext): QueuePriorityLevel {
    if (ctx.dbPriority) {
      return ctx.dbPriority
    }

    if (ctx.onboarding) {
      return QueuePriorityLevel.HIGH
    }

    return QueuePriorityLevel.NORMAL
  }
}
