import { RedisCache, RedisClient } from '@crowd/redis'
import { Logger } from '@crowd/logging'
import { getSecondsTillEndOfMonth } from '../utils/timing'
import AutomationRepository from '../database/repositories/automationRepository'
import { FeatureFlagRedisKey } from '../types/common'

export default async function getFeatureFlagTenantContext(
  tenant: any,
  database: any,
  redis: RedisClient,
  log: Logger,
) {
  const automationCount = await AutomationRepository.countAllActive(database, tenant.id)
  const csvExportCountCache = new RedisCache(FeatureFlagRedisKey.CSV_EXPORT_COUNT, redis, log)
  const memberEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
    redis,
    log,
  )

  let csvExportCount = await csvExportCountCache.get(tenant.id)
  let memberEnrichmentCount = await memberEnrichmentCountCache.get(tenant.id)

  const secondsRemainingUntilEndOfMonth = getSecondsTillEndOfMonth()

  if (!csvExportCount) {
    await csvExportCountCache.set(tenant.id, '0', secondsRemainingUntilEndOfMonth)
    csvExportCount = '0'
  }

  if (!memberEnrichmentCount) {
    await memberEnrichmentCountCache.set(tenant.id, '0', secondsRemainingUntilEndOfMonth)
    memberEnrichmentCount = '0'
  }

  return {
    tenantId: tenant.id,
    plan: tenant.plan,
    automationCount: automationCount.toString(),
    csvExportCount,
    memberEnrichmentCount,
  }
}
