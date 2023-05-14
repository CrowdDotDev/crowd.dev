import { ORGANIZATION_ENRICHMENT_CONFIG } from '../../../../config'
import getUserContext from '../../../../database/utils/getUserContext'
import { PLAN_LIMITS } from '../../../../feature-flags/isFeatureEnabled'
import OrganizationEnrichmentService from '../../../../services/premium/enrichment/organizationEnrichmentService'
import { FeatureFlag, FeatureFlagRedisKey } from '../../../../types/common'
import { createRedisClient } from '../../../../utils/redis'
import { RedisCache } from '../../../../utils/redis/redisCache'
import { getSecondsTillEndOfMonth } from '../../../../utils/timing'

export async function BulkorganizationEnrichmentWorker(tenantId: string) {
  const userContext = await getUserContext(tenantId)
  const redis = await createRedisClient(true)
  const organizationEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.ORGANIZATION_ENRICHMENT_COUNT,
    redis,
  )
  const usedEnrichmentCount = parseInt(
    (await organizationEnrichmentCountCache.getValue(userContext.currentTenant.id)) ?? '0',
    10,
  )
  const remainderEnrichmentLimit =
    PLAN_LIMITS[userContext.currentTenant.plan][FeatureFlag.ORGANIZATION_ENRICHMENT] -
    usedEnrichmentCount

  let enrichedOrgs = []
  if (remainderEnrichmentLimit > 0) {
    const enrichmentService = new OrganizationEnrichmentService({
      options: userContext,
      apiKey: ORGANIZATION_ENRICHMENT_CONFIG.apiKey,
      tenantId,
      limit: remainderEnrichmentLimit,
    })
    enrichedOrgs = await enrichmentService.enrichOrganizationsAndSignalDone()
  }

  await organizationEnrichmentCountCache.setValue(
    userContext.currentTenant.id,
    (usedEnrichmentCount + enrichedOrgs.length).toString(),
    getSecondsTillEndOfMonth(),
  )
}
