import { Error404 } from '@crowd/common'
import { RedisCache } from '@crowd/redis'
import { FeatureFlagRedisKey } from '@crowd/types'

import AutomationRepository from '@/database/repositories/automationRepository'

import Permissions from '../../security/permissions'
import identifyTenant from '../../segment/identifyTenant'
import TenantService from '../../services/tenantService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  req.currentTenant = { id: req.params.tenantId }
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)
  let payload
  if (req.params.tenantId) {
    payload = await new TenantService(req).findById(req.params.tenantId)
  } else {
    payload = await new TenantService(req).findByUrl(req.query.url)
  }

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

  payload.dataValues = {
    ...payload.dataValues,
    csvExportCount: Number(await csvExportCountCache.get(payload.id)) || 0,
    automationCount:
      Number(await AutomationRepository.countAllActive(req.database, payload.id)) || 0,
    memberEnrichmentCount: Number(await memberEnrichmentCountCache.get(payload.id)) || 0,
  }

  payload.dataValues.settings[0].dataValues = {
    ...payload.dataValues.settings[0].dataValues,
    slackWebHook: !!payload.settings[0].dataValues.slackWebHook,
  }

  if (payload) {
    if (req.currentUser) {
      identifyTenant({ ...req, currentTenant: payload })
    }

    await req.responseHandler.success(req, res, payload)
  } else {
    throw new Error404()
  }
}
