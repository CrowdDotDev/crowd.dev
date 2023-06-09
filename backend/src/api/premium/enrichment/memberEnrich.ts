import { RedisCache } from '@crowd/redis'
import { getServiceLogger } from '@crowd/logging'
import { getSecondsTillEndOfMonth } from '../../../utils/timing'
import Permissions from '../../../security/permissions'
import identifyTenant from '../../../segment/identifyTenant'
import MemberEnrichmentService from '../../../services/premium/enrichment/memberEnrichmentService'
import PermissionChecker from '../../../services/user/permissionChecker'
import { FeatureFlagRedisKey } from '../../../types/common'
import track from '../../../segment/track'

const log = getServiceLogger()

/**
 * PUT /tenant/{tenantId}/enrichment/member/{id}
 * @summary Enrich a member
 * @tag Members
 * @security Bearer
 * @description Enrich a member.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the member
 * @response 200 - Ok
 * @responseContent {MemberResponse} 200.application/json
 * @responseExample {MemberFind} 200.application/json.Member
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const payload = await new MemberEnrichmentService(req).enrichOne(req.params.id)

  track('Single member enrichment', { memberId: req.params.id }, { ...req })

  const memberEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
    req.redis,
    req.log,
  )

  const memberEnrichmentCount = await memberEnrichmentCountCache.get(req.currentTenant.id)

  const secondsRemainingUntilEndOfMonth = getSecondsTillEndOfMonth()

  log.info(secondsRemainingUntilEndOfMonth, 'Seconds remaining')

  if (!memberEnrichmentCount) {
    await memberEnrichmentCountCache.set(req.currentTenant.id, '0', secondsRemainingUntilEndOfMonth)
  } else {
    await memberEnrichmentCountCache.set(
      req.currentTenant.id,
      (parseInt(memberEnrichmentCount, 10) + 1).toString(),
      secondsRemainingUntilEndOfMonth,
    )
  }

  identifyTenant(req)

  await req.responseHandler.success(req, res, payload)
}
