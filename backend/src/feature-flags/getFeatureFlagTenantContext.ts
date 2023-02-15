import AutomationRepository from '../database/repositories/automationRepository'
import { FeatureFlagRedisKey } from '../types/common'
import { RedisClient } from '../utils/redis'
import { RedisCache } from '../utils/redis/redisCache'
import { getSecondsTillEndOfMonth } from '../utils/timing'

export default async function getFeatureFlagTenantContext(
  tenant: any,
  database: any,
  redis: RedisClient,
) {
  const automationCount = await AutomationRepository.countAll(database, tenant.id)
  const csvExportCountCache = new RedisCache(FeatureFlagRedisKey.CSV_EXPORT_COUNT, redis)
  const memberEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
    redis,
  )

  let csvExportCount = await csvExportCountCache.getValue(tenant.id)
  let memberEnrichmentCount = await memberEnrichmentCountCache.getValue(tenant.id)

  const secondsRemainingUntilEndOfMonth = getSecondsTillEndOfMonth()

  if (!csvExportCount) {
    await csvExportCountCache.setValue(tenant.id, '0', secondsRemainingUntilEndOfMonth)
    csvExportCount = '0'
  }

  if (!memberEnrichmentCount) {
    await memberEnrichmentCountCache.setValue(tenant.id, '0', secondsRemainingUntilEndOfMonth)
    memberEnrichmentCount = '0'
  }

  return {
    tenantId: tenant.id,
    plan: tenant.plan,
    automationCount,
    csvExportCount: parseInt(csvExportCount, 10),
    memberEnrichmentCount: parseInt(memberEnrichmentCount, 10),
  }
}
