import { IS_DEV_ENV, IS_STAGING_ENV, IS_TEST_ENV, groupBy } from '@crowd/common'
import { UnleashClient, isFeatureEnabled } from '@crowd/feature-flags'
import { Logger, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { CrowdQueue, ISqsQueueConfig, SqsClient, SqsPrioritizedQueueEmitter } from '@crowd/sqs'
import { Tracer } from '@crowd/tracing'
import {
  FeatureFlag,
  IQueuePriorityCalculationContext,
  IQueueMessage,
  QueuePriorityLevel,
  TenantPlans,
} from '@crowd/types'

export type QueuePriorityContextLoader = (
  tenantId: string,
) => Promise<IQueuePriorityCalculationContext>

export class QueuePriorityService {
  private readonly log: Logger
  private readonly cache: RedisCache

  private readonly emitter: SqsPrioritizedQueueEmitter

  public constructor(
    public readonly queue: CrowdQueue,
    private readonly queueConfig: ISqsQueueConfig,
    private readonly sqsClient: SqsClient,
    private readonly redis: RedisClient,
    private readonly tracer: Tracer,
    private readonly unleash: UnleashClient | undefined,
    private readonly priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    this.log = getChildLogger(this.constructor.name, parentLog)
    this.cache = new RedisCache('queue-priority', redis, this.log)
    this.emitter = new SqsPrioritizedQueueEmitter(
      this.sqsClient,
      this.queueConfig,
      this.tracer,
      this.log,
    )
  }

  public async init(): Promise<void> {
    await this.emitter.init()
  }

  public async setMessageVisibilityTimeout(
    tenantId: string,
    receiptHandle: string,
    newVisibility: number,
  ): Promise<void> {
    // feature flag will be cached for 5 minutes
    if (
      isFeatureEnabled(
        FeatureFlag.PRIORITIZED_QUEUES,
        async () => {
          return {
            tenantId,
          }
        },
        this.unleash,
        this.redis,
        5 * 60,
        tenantId,
      )
    ) {
      const priorityLevel = await this.getPriorityLevel(
        tenantId,
        this.priorityLevelCalculationContextLoader,
      )

      return this.emitter.setMessageVisibilityTimeout(receiptHandle, newVisibility, priorityLevel)
    } else {
      return this.emitter.setMessageVisibilityTimeout(receiptHandle, newVisibility)
    }
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
      // feature flag will be cached for 5 minutes
      if (
        isFeatureEnabled(
          FeatureFlag.PRIORITIZED_QUEUES,
          async () => {
            return {
              tenantId,
            }
          },
          this.unleash,
          this.redis,
          5 * 60,
          tenantId,
        )
      ) {
        const priorityLevel = await this.getPriorityLevel(
          tenantId,
          this.priorityLevelCalculationContextLoader,
        )

        return this.emitter.sendMessages(
          messages.map((m) => {
            return { ...m, priorityLevel }
          }),
        )
      } else {
        return this.emitter.sendMessages(messages)
      }
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
    // feature flag will be cached for 5 minutes
    if (
      isFeatureEnabled(
        FeatureFlag.PRIORITIZED_QUEUES,
        async () => {
          return {
            tenantId,
          }
        },
        this.unleash,
        this.redis,
        5 * 60,
        tenantId,
      )
    ) {
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

      return this.emitter.sendMessage(groupId, message, deduplicationId, priorityLevel)
    } else {
      return this.emitter.sendMessage(groupId, message, deduplicationId)
    }
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

    if (ctx.plan === TenantPlans.Essential) {
      if (ctx.onboarding) {
        return QueuePriorityLevel.HIGH
      }

      return QueuePriorityLevel.NORMAL
    } else {
      if (ctx.onboarding) {
        return QueuePriorityLevel.URGENT
      }

      return QueuePriorityLevel.HIGH
    }
  }
}
