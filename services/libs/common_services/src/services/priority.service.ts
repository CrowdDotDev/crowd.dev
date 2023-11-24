import { Logger, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IPriorityPriorityCalculationContext, QueuePriorityLevel, TenantPlans } from '@crowd/types'

export type QueuePriorityContextLoader<T> = (
  args?: T,
) => Promise<IPriorityPriorityCalculationContext>

export class QueuePriorityService {
  private readonly log: Logger
  private readonly cache: RedisCache

  public constructor(redis: RedisClient, parentLog: Logger) {
    this.log = getChildLogger(this.constructor.name, parentLog)
    this.cache = new RedisCache('queue-priority', redis, this.log)
  }

  public async getPriorityLevel<T>(
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

  public calculateQueuePriorityLevel(ctx: IPriorityPriorityCalculationContext): QueuePriorityLevel {
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
