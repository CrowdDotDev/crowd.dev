import { MemberQueryCache } from '@crowd/data-access-layer'
import { getServiceLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'

const logger = getServiceLogger()

export async function invalidateMemberQueryCache(
  redis: RedisClient,
  memberIds?: string[],
  invalidateAll = false,
): Promise<void> {
  try {
    const cache = new MemberQueryCache(redis)

    if (memberIds && memberIds.length > 0) {
      // Invalidate specific member cache entries (queries with filter.id.eq)
      for (const memberId of memberIds) {
        await cache.invalidateByPattern(`members_advanced:${memberId}:*`)
      }

      logger.debug(`Invalidated member query cache for ${memberIds.length} specific members`)

      // Only invalidate all caches if explicitly requested
      // This is useful for operations like update/delete that affect list views
      if (invalidateAll) {
        await cache.invalidateAll()
        logger.debug('Invalidated all member query cache entries')
      }
    } else {
      // Invalidate all cache entries
      await cache.invalidateAll()
      logger.debug('Invalidated all member query cache')
    }
  } catch (error) {
    // Don't fail the operation if cache invalidation fails
    logger.warn('Failed to invalidate member query cache', { error })
  }
}
