import { getRedisClient, RedisCache } from '@crowd/redis'
import { FeatureFlag, FeatureFlagRedisKey, PLAN_LIMITS } from '@crowd/types'
import { getSecondsTillEndOfMonth } from '../../../../utils/timing'
import { ORGANIZATION_ENRICHMENT_CONFIG, REDIS_CONFIG } from '../../../../conf'
import getUserContext from '../../../../database/utils/getUserContext'
import OrganizationEnrichmentService from '../../../../services/premium/enrichment/organizationEnrichmentService'

export async function BulkorganizationEnrichmentWorker(
  tenantId: string,
  maxEnrichLimit: number = 0,
  verbose: boolean = false,
  includeOrgsActiveLastYear: boolean = false,
) {
  const userContext = await getUserContext(tenantId)
  const redis = await getRedisClient(REDIS_CONFIG, true)
  const organizationEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.ORGANIZATION_ENRICHMENT_COUNT,
    redis,
    userContext.log,
  )
  const usedEnrichmentCount = parseInt(
    (await organizationEnrichmentCountCache.get(userContext.currentTenant.id)) ?? '0',
    10,
  )

  // Discard limits and credits if maxEnrichLimit is provided
  const skipCredits = maxEnrichLimit > 0

  const remainderEnrichmentLimit = skipCredits
    ? maxEnrichLimit // Use maxEnrichLimit as the limit if provided
    : PLAN_LIMITS[userContext.currentTenant.plan][FeatureFlag.ORGANIZATION_ENRICHMENT] -
      usedEnrichmentCount

  let enrichedOrgs = []
  if (remainderEnrichmentLimit > 0) {
    const enrichmentService = new OrganizationEnrichmentService({
      options: userContext,
      apiKey: ORGANIZATION_ENRICHMENT_CONFIG.apiKey,
      tenantId,
      limit: remainderEnrichmentLimit,
    })
    enrichedOrgs = await enrichmentService.enrichOrganizationsAndSignalDone(
      includeOrgsActiveLastYear,
      verbose,
    )
  }

  if (!skipCredits) {
    await organizationEnrichmentCountCache.set(
      userContext.currentTenant.id,
      (usedEnrichmentCount + enrichedOrgs.length).toString(),
      getSecondsTillEndOfMonth(),
    )
  }
}
