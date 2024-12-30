import { RedisCache } from '@crowd/redis'
import { FeatureFlagRedisKey, ITriggerCSVExport } from '@crowd/types'

import { svc } from '../main'

const csvCountCache = new RedisCache(FeatureFlagRedisKey.CSV_EXPORT_COUNT, svc.redis, svc.log)

/*
decrementUsage is a Temporal activity that decrements the CSV export usage of a
tenant. This activity is triggered only if the workflow failed.
*/
export async function decrementUsage(input: ITriggerCSVExport): Promise<void> {
  try {
    await csvCountCache.decrement(input.tenantId, 1)
  } catch (err) {
    throw new Error(err)
  }
}
