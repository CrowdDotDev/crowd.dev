import { IS_DEV_ENV, IS_TEST_ENV, groupBy } from '@crowd/common'
import { UnleashClient, isFeatureEnabled } from '@crowd/feature-flags'
import { Logger, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { CrowdQueue, ISqsQueueConfig, SqsClient, SqsPrioritizedQueueEmitter } from '@crowd/sqs'
import { Tracer } from '@crowd/tracing'
import {
  FeatureFlag,
  IPriorityPriorityCalculationContext,
  IQueueMessage,
  QueuePriorityLevel,
  TenantPlans,
} from '@crowd/types'

export type QueuePriorityContextLoader = (
  tenantId: string,
) => Promise<IPriorityPriorityCalculationContext>

export class QueuePriorityService {
  private readonly log: Logger
  private readonly cache: RedisCache

  private readonly emittersMap: Map<string, SqsPrioritizedQueueEmitter> = new Map()

  public constructor(
    private readonly sqsClient: SqsClient,
    private readonly redis: RedisClient,
    private readonly tracer: Tracer,
    private readonly unleash: UnleashClient | undefined,
    private readonly priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    this.log = getChildLogger(this.constructor.name, parentLog)
    this.cache = new RedisCache('queue-priority', redis, this.log)
  }

  public async init(queueConfigs: ISqsQueueConfig[]): Promise<void> {
    await Promise.all(
      queueConfigs.map((c) => {
        const emitter = new SqsPrioritizedQueueEmitter(this.sqsClient, c, this.tracer, this.log)
        this.emittersMap.set(c.name, emitter)
        return emitter.init()
      }),
    )
  }

  public async sendMessages<T extends IQueueMessage>(
    queue: CrowdQueue,
    messages: {
      tenantId: string
      payload: T
      groupId: string
      deduplicationId?: string
      id?: string
    }[],
  ): Promise<void> {
    const emitter = this.getEmitter(queue)

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

        return emitter.sendMessages(
          messages.map((m) => {
            return { ...m, priorityLevel }
          }),
        )
      } else {
        return emitter.sendMessages(messages)
      }
    }
  }

  public async sendMessage<T extends IQueueMessage>(
    queue: CrowdQueue,
    tenantId: string | undefined,
    groupId: string,
    message: T,
    deduplicationId?: string,
    priorityLevelContextOverride?: unknown,
    priorityLevelOverride?: QueuePriorityLevel,
  ): Promise<void> {
    const emitter = this.getEmitter(queue)

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
      }

      return emitter.sendMessage(groupId, message, deduplicationId, priorityLevel)
    } else {
      return emitter.sendMessage(groupId, message, deduplicationId)
    }
  }

  private getEmitter(queue: string): SqsPrioritizedQueueEmitter {
    if (this.emittersMap.has(queue)) {
      return this.emittersMap.get(queue) as SqsPrioritizedQueueEmitter
    }

    throw new Error(
      `Emitter for queue ${queue} is not configured! Add it to the init method and make sure it's called!`,
    )
  }

  private async getPriorityLevel(
    tenantId: string,
    loader: QueuePriorityContextLoader,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    override?: any,
  ): Promise<QueuePriorityLevel> {
    if (IS_DEV_ENV || IS_TEST_ENV) {
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

  private calculateQueuePriorityLevel(
    ctx: IPriorityPriorityCalculationContext,
  ): QueuePriorityLevel {
    if (ctx.dbPriority) {
      return ctx.dbPriority
    }

    if (ctx.plan === TenantPlans.Essential) {
      if (ctx.onboarding) {
        return QueuePriorityLevel.HIGH
      }

      return QueuePriorityLevel.NORMAL
    } else {
      return QueuePriorityLevel.URGENT
    }
  }
}
