import { RedisCache } from '@crowd/redis'
import { Error403 } from '@crowd/common'
import { FeatureFlagRedisKey } from '@crowd/types'
import AutomationRepository from '../../database/repositories/automationRepository'
import SegmentService from '../../services/segmentService'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    await req.responseHandler.error(req, res, new Error403(req.language))
    return
  }

  const payload = req.currentUser

  console.log('getting user', new Date().getTime())

  const csvExportCountCache = new RedisCache(
    FeatureFlagRedisKey.CSV_EXPORT_COUNT,
    req.redis,
    req.log,
  )
  console.log('csv export', new Date().getTime())
  const memberEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
    req.redis,
    req.log,
  )

  console.log('enrichment count', new Date().getTime())
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

      const segmentService = new SegmentService(req)
      const tenantSubprojects = await segmentService.getTenantSubprojects(tenantUser.tenant)
      const activityTypes = await SegmentService.getTenantActivityTypes(tenantSubprojects)
      const activityChannels = await SegmentService.getTenantActivityChannels(
        tenantUser.tenant,
        req,
      )

      // TODO: return actual activityTypes using segment information
      tenantUser.tenant.dataValues.settings[0].dataValues = {
        ...tenantUser.tenant.dataValues.settings[0].dataValues,
        activityTypes,
        activityChannels,
        slackWebHook: !!tenantUser.tenant.settings[0].dataValues.slackWebHook,
      }
      console.log('mapping settings', new Date().getTime())

      return tenantUser
    }),
  )

  console.log('tenants mapped', new Date().getTime())

  await req.responseHandler.success(req, res, payload)
}
