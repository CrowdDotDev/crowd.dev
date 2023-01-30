import AutomationRepository from '../../database/repositories/automationRepository'
import Error403 from '../../errors/Error403'
import { FeatureFlagRedisKey } from '../../types/common'
import { RedisCache } from '../../utils/redis/redisCache'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    await req.responseHandler.error(req, res, new Error403(req.language))
    return
  }

  const payload = req.currentUser

  const csvExportCountCache = new RedisCache(FeatureFlagRedisKey.CSV_EXPORT_COUNT, req.redis)
  const memberEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
    req.redis,
  )

  payload.tenants = await Promise.all(
    payload.tenants.map(async (tenantUser) => {
      tenantUser.tenant.dataValues = {
        ...tenantUser.tenant.dataValues,
        csvExportCount: Number(await csvExportCountCache.getValue(tenantUser.tenant.id)) || 0,
        automationCount:
          Number(await AutomationRepository.countAll(req.database, tenantUser.tenant.id)) || 0,
        memberEnrichmentCount:
          Number(await memberEnrichmentCountCache.getValue(tenantUser.tenant.id)) || 0,
      }
      return tenantUser
    }),
  )

  await req.responseHandler.success(req, res, payload)
}
