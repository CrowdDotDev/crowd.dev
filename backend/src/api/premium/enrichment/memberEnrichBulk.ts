import { RedisCache } from '@crowd/redis'
import { getServiceLogger } from '@crowd/logging'
import { Error403 } from '@crowd/common'
import { FeatureFlag, FeatureFlagRedisKey } from '@crowd/types'
import { getSecondsTillEndOfMonth } from '../../../utils/timing'
import Permissions from '../../../security/permissions'
import identifyTenant from '../../../segment/identifyTenant'
import { sendBulkEnrichMessage } from '../../../serverless/utils/nodeWorkerSQS'
import PermissionChecker from '../../../services/user/permissionChecker'
import track from '../../../segment/track'
import { PLAN_LIMITS } from '../../../feature-flags/isFeatureEnabled'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'

const log = getServiceLogger()

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)
  const membersToEnrich = req.body.members
  const tenant = req.currentTenant.id
  const segmentIds = SequelizeRepository.getSegmentIds(req)

  const memberEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
    req.redis,
    req.log,
  )
  const memberEnrichmentCount = await memberEnrichmentCountCache.get(req.currentTenant.id)

  log.info(parseInt(memberEnrichmentCount, 10) + membersToEnrich.length, 'Total: ')

  // Check if requested enrich count is over limit
  if (
    parseInt(memberEnrichmentCount, 10) + membersToEnrich.length >
    PLAN_LIMITS[req.currentTenant.plan][FeatureFlag.MEMBER_ENRICHMENT]
  ) {
    track(
      `Bulk member enrichment`,
      { count: membersToEnrich.length, memberIds: membersToEnrich, overTheLimit: true },
      { ...req },
    )

    await req.responseHandler.error(
      req,
      res,
      new Error403(req.language, 'enrichment.errors.requestedEnrichmentMoreThanLimit'),
    )
    return
  }

  track(
    'Bulk member enrichment',
    { count: membersToEnrich.length, memberIds: membersToEnrich, overTheLimit: false },
    { ...req },
  )

  // send the message
  await sendBulkEnrichMessage(tenant, membersToEnrich, segmentIds)

  // update enrichment count, we'll also check failed enrichments and deduct these from grand total in bulkEnrichmentWorker
  const secondsRemainingUntilEndOfMonth = getSecondsTillEndOfMonth()

  if (!memberEnrichmentCount) {
    await memberEnrichmentCountCache.set(req.currentTenant.id, '0', secondsRemainingUntilEndOfMonth)
  } else {
    await memberEnrichmentCountCache.set(
      req.currentTenant.id,
      (parseInt(memberEnrichmentCount, 10) + membersToEnrich.length).toString(),
      secondsRemainingUntilEndOfMonth,
    )
  }

  identifyTenant(req)

  await req.responseHandler.success(req, res, membersToEnrich)
}
