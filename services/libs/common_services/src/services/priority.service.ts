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

export type QueuePriorityContextLoader<T> = (
  args?: T,
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

  public async sendMessage<T>(
    queue: CrowdQueue,
    tenantId: string,
    groupId: string,
    message: IQueueMessage,
    priorityLevelCacheKey: string,
    priorityLevelContextloader: QueuePriorityContextLoader<T>,
    featureFlagCacheKey: string,
    deduplicationId?: string,
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
        featureFlagCacheKey,
      )
    ) {
      const priorityLevel = await this.getPriorityLevel(
        priorityLevelCacheKey,
        priorityLevelContextloader,
      )
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

  private async getPriorityLevel<T>(
    cacheKey: string,
    loader: QueuePriorityContextLoader<T>,
  ): Promise<QueuePriorityLevel> {
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached as QueuePriorityLevel
    }

    const ctx = await loader()
    const priority = this.calculateQueuePriorityLevel(ctx)

    // cache for 5 minutes
    await this.cache.set(cacheKey, priority, 5 * 60)

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
