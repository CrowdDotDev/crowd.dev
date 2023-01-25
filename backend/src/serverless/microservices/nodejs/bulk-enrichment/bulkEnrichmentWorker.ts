import moment from 'moment-timezone'
import { PostHog } from 'posthog-node'
import { POSTHOG_CONFIG } from '../../../../config'
import getUserContext from '../../../../database/utils/getUserContext'
import setPosthogTenantProperties from '../../../../feature-flags/setTenantProperties'
import MemberEnrichmentService from '../../../../services/premium/enrichment/memberEnrichmentService'
import { FeatureFlagRedisKey } from '../../../../types/common'
import { createRedisClient } from '../../../../utils/redis'
import { RedisCache } from '../../../../utils/redis/redisCache'

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
    const redis = await createRedisClient(true)

    // get redis cache that stores memberEnrichmentCount
    const memberEnrichmentCountCache = new RedisCache(
      FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
      redis,
    )

    // get current enrichment count of tenant from redis
    const memberEnrichmentCount = await memberEnrichmentCountCache.getValue(
      userContext.currentTenant.id,
    )

    // calculate remaining seconds for the end of the month, to set TTL for redis keys
    const endTime = moment().endOf('month')
    const startTime = moment()
    const secondsRemainingUntilEndOfMonth = endTime.diff(startTime, 'days') * 86400

    if (!memberEnrichmentCount) {
      await memberEnrichmentCountCache.setValue(
        userContext.currentTenant.id,
        '0',
        secondsRemainingUntilEndOfMonth,
      )
    } else {
      // Before sending the queue message, we increase the memberEnrichmentCount with all member Ids that are sent,
      // assuming that we'll be able to enrich all.
      // If any of enrichments failed, we should add these credits back, reducing memberEnrichmentCount
      await memberEnrichmentCountCache.setValue(
        userContext.currentTenant.id,
        (parseInt(memberEnrichmentCount, 10) - failedEnrichmentRequests).toString(),
        secondsRemainingUntilEndOfMonth,
      )
    }

    // send data to posthog
    setPosthogTenantProperties(
      userContext.currentTenant,
      new PostHog(POSTHOG_CONFIG.apiKey, { flushAt: 1, flushInterval: 1 }),
      userContext.database,
      redis,
    )
  }
}
export { bulkEnrichmentWorker }
