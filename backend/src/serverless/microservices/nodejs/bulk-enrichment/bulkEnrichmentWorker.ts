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

    const memberEnrichmentCountCache = new RedisCache(
      FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
      redis,
    )

    const memberEnrichmentCount = await memberEnrichmentCountCache.getValue(
      userContext.currentTenant.id,
    )

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
      await memberEnrichmentCountCache.setValue(
        userContext.currentTenant.id,
        (parseInt(memberEnrichmentCount, 10) - failedEnrichmentRequests).toString(),
        secondsRemainingUntilEndOfMonth,
      )
    }
    setPosthogTenantProperties(
      userContext.currentTenant,
      new PostHog(POSTHOG_CONFIG.apiKey, { flushAt: 1, flushInterval: 1 }),
      userContext.database,
      redis,
    )
  }
}
export { bulkEnrichmentWorker }
