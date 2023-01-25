import moment from 'moment'
import Error403 from '../../../errors/Error403'
import { PLAN_LIMITS } from '../../../feature-flags/ensureFlagUpdated'
import Permissions from '../../../security/permissions'
import identifyTenant from '../../../segment/identifyTenant'
import { sendBulkEnrichMessage } from '../../../serverless/utils/nodeWorkerSQS'
import PermissionChecker from '../../../services/user/permissionChecker'
import { FeatureFlag, FeatureFlagRedisKey } from '../../../types/common'
import { createServiceLogger } from '../../../utils/logging'
import { RedisCache } from '../../../utils/redis/redisCache'

const log = createServiceLogger()

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)
  const membersToEnrich = req.body.members
  const tenant = req.currentTenant.id

  const memberEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
    req.redis,
  )
  const memberEnrichmentCount = await memberEnrichmentCountCache.getValue(req.currentTenant.id)

  log.info(parseInt(memberEnrichmentCount, 10) + membersToEnrich.length, 'Total: ')

  // Check if requested enrich count is over limit
  if (
    parseInt(memberEnrichmentCount, 10) + membersToEnrich.length >
    PLAN_LIMITS[req.currentTenant.plan][FeatureFlag.MEMBER_ENRICHMENT]
  ) {
    await req.responseHandler.error(
      req,
      res,
      new Error403(req.language, 'enrichment.errors.requestedEnrichmentMoreThanLimit'),
    )
    return
  }

  // send the message
  await sendBulkEnrichMessage(tenant, membersToEnrich)

  // update enrichment count, we'll also check failed enrichments and deduct these from grand total in bulkEnrichmentWorker
  const endTime = moment().endOf('month')
  const startTime = moment()

  const secondsRemainingUntilEndOfMonth = endTime.diff(startTime, 'days') * 86400

  if (!memberEnrichmentCount) {
    await memberEnrichmentCountCache.setValue(
      req.currentTenant.id,
      '0',
      secondsRemainingUntilEndOfMonth,
    )
  } else {
    await memberEnrichmentCountCache.setValue(
      req.currentTenant.id,
      (parseInt(memberEnrichmentCount, 10) + membersToEnrich.length).toString(),
      secondsRemainingUntilEndOfMonth,
    )
  }

  identifyTenant(req)

  await req.responseHandler.success(req, res, membersToEnrich)
}
