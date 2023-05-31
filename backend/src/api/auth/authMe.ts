import { RedisCache } from '@crowd/redis'
import AutomationRepository from '../../database/repositories/automationRepository'
import SettingsRepository from '../../database/repositories/settingsRepository'
import Error403 from '../../errors/Error403'
import { FeatureFlagRedisKey } from '../../types/common'

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
          Number(await AutomationRepository.countAll(req.database, tenantUser.tenant.id)) || 0,
        memberEnrichmentCount:
          Number(await memberEnrichmentCountCache.get(tenantUser.tenant.id)) || 0,
      }

      tenantUser.tenant.dataValues.settings[0].dataValues = {
        ...tenantUser.tenant.dataValues.settings[0].dataValues,
        activityTypes: await SettingsRepository.buildActivityTypes(
          tenantUser.tenant.settings[0].dataValues,
        ),
        slackWebHook: !!tenantUser.tenant.settings[0].dataValues.slackWebHook,
      }

      return tenantUser
    }),
  )

  await req.responseHandler.success(req, res, payload)
}
