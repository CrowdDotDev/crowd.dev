import { FeatureFlag, FeatureFlagRedisKey, PLAN_LIMITS, TenantPlans } from '@crowd/types'
import { IPremiumTenantInfo } from '../repos/tenant.repo'
import { RedisCache } from '@crowd/redis'
import { svc } from '../main'

export async function getTenantCredits(tenant: IPremiumTenantInfo): Promise<number> {
  if (tenant.plan === TenantPlans.Growth) {
    // need to check how many credits the tenant has left
    const cache = new RedisCache(
      FeatureFlagRedisKey.ORGANIZATION_ENRICHMENT_COUNT,
      svc.redis,
      svc.log,
    )
    const usedCredits = parseInt((await cache.get(tenant.id)) ?? '0', 10)
    const remainingCredits =
      PLAN_LIMITS[TenantPlans.Growth][FeatureFlag.ORGANIZATION_ENRICHMENT] - usedCredits
    return remainingCredits
  }

  if ([TenantPlans.Enterprise, TenantPlans.Scale].includes(tenant.plan)) {
    return -1
  }

  throw new Error(`Only premium tenant plans are supported - got ${tenant.plan}!`)
}
