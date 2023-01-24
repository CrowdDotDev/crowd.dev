import moment from 'moment'
import Permissions from '../../../security/permissions'
import identifyTenant from '../../../segment/identifyTenant'
import MemberEnrichmentService from '../../../services/premium/enrichment/memberEnrichmentService'
import PermissionChecker from '../../../services/user/permissionChecker'
import { FeatureFlagRedisKey } from '../../../types/common'
import { RedisCache } from '../../../utils/redis/redisCache'

// /**
//  * PUT /tenant/{tenantId}/member/{id}
//  * @summary Update a member
//  * @tag Members
//  * @security Bearer
//  * @description Update a member
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @pathParam {string} id - The ID of the member
//  * @bodyContent {MemberUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Member} 200.application/json
//  * @responseExample {MemberUpsert} 200.application/json.Member
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)
  const payload = await new MemberEnrichmentService(req).enrichOne(req.params.id)

  const memberEnrichmentCountCache = new RedisCache(
    FeatureFlagRedisKey.MEMBER_ENRICHMENT_COUNT,
    req.redis,
  )

  const memberEnrichmentCount = await memberEnrichmentCountCache.getValue(req.currentTenant.id)

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
      (parseInt(memberEnrichmentCount, 10) + 1).toString(),
      secondsRemainingUntilEndOfMonth,
    )
  }

  identifyTenant(req)

  await req.responseHandler.success(req, res, payload)
}
