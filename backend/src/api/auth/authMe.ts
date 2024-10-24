import { Error403 } from '@crowd/common'
import { RedisCache } from '@crowd/redis'
import { FeatureFlagRedisKey } from '@crowd/types'

import AutomationRepository from '@/database/repositories/automationRepository'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    await req.responseHandler.error(req, res, new Error403(req.language))
    return
  }

  const payload = req.currentUser

  const csvExportCountCache = new RedisCache(
    FeatureFlagRedisKey.CSV_EXPORT_COUNT,
    req.redis,
    req.log,
  )

  const memberEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
    req.redis,
    req.log,
  )

  payload.tenants = await Promise.all(
    payload.tenants.map(async (tenantUser) => {
      tenantUser.tenant.dataValues = {
        ...tenantUser.tenant.dataValues,
        csvExportCount: Number(await csvExportCountCache.get(tenantUser.tenant.id)) || 0,
        automationCount:
          Number(await AutomationRepository.countAllActive(req.database, tenantUser.tenant.id)) ||
          0,
        memberEnrichmentCount:
          Number(await memberEnrichmentCountCache.get(tenantUser.tenant.id)) || 0,
      }
      return tenantUser
    }),
  )

  await req.responseHandler.success(req, res, payload)
}
