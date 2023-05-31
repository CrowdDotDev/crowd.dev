import { getRedisClient, RedisCache } from '@crowd/redis'
import { getSecondsTillEndOfMonth } from '@crowd/common'
import { REDIS_CONFIG } from '../../../../conf'
import getUserContext from '../../../../database/utils/getUserContext'
import MemberEnrichmentService from '../../../../services/premium/enrichment/memberEnrichmentService'
import { FeatureFlagRedisKey } from '../../../../types/common'

/**
 * Sends weekly analytics emails of a given tenant
 * to all users of the tenant.
 * Data sent is for the last week.
 * @param tenantId
 */
async function bulkEnrichmentWorker(tenantId: string, memberIds: string[]) {
  const userContext = await getUserContext(tenantId)

  const memberEnrichmentService = new MemberEnrichmentService(userContext)

  const { enrichedMemberCount } = await memberEnrichmentService.bulkEnrich(memberIds)

  const failedEnrichmentRequests = memberIds.length - enrichedMemberCount

  // if there are failed enrichments, deduct these from total memberEnrichmentCount credits
  if (failedEnrichmentRequests > 0) {
    const redis = await getRedisClient(REDIS_CONFIG, true)

    // get redis cache that stores memberEnrichmentCount
    const memberEnrichmentCountCache = new RedisCache(
      FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
      redis,
      userContext.log,
    )

    // get current enrichment count of tenant from redis
    const memberEnrichmentCount = await memberEnrichmentCountCache.get(userContext.currentTenant.id)

    // calculate remaining seconds for the end of the month, to set TTL for redis keys
    const secondsRemainingUntilEndOfMonth = getSecondsTillEndOfMonth()

    if (!memberEnrichmentCount) {
      await memberEnrichmentCountCache.set(
        userContext.currentTenant.id,
        '0',
        secondsRemainingUntilEndOfMonth,
      )
    } else {
      // Before sending the queue message, we increase the memberEnrichmentCount with all member Ids that are sent,
      // assuming that we'll be able to enrich all.
      // If any of enrichments failed, we should add these credits back, reducing memberEnrichmentCount
      await memberEnrichmentCountCache.set(
        userContext.currentTenant.id,
        (parseInt(memberEnrichmentCount, 10) - failedEnrichmentRequests).toString(),
        secondsRemainingUntilEndOfMonth,
      )
    }
  }
}
export { bulkEnrichmentWorker }
