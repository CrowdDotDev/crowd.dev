import { RedisCache } from '@crowd/redis'
import { getSecondsTillEndOfMonth } from '@crowd/common'
import Permissions from '../../security/permissions'
import identifyTenant from '../../segment/identifyTenant'
import track from '../../segment/track'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'
import { FeatureFlagRedisKey } from '../../types/common'

/**
 * POST /tenant/{tenantId}/member/export
 * @summary Export members as CSV
 * @tag Members
 * @security Bearer
 * @description Export members. It accepts filters, sorting options and pagination.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {MemberQuery} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const payload = await new MemberService(req).export(req.body)

  const csvCountCache = new RedisCache(FeatureFlagRedisKey.CSV_EXPORT_COUNT, req.redis, req.log)

  const csvCount = await csvCountCache.get(req.currentTenant.id)

  const secondsRemainingUntilEndOfMonth = getSecondsTillEndOfMonth()

  if (!csvCount) {
    await csvCountCache.set(req.currentTenant.id, '0', secondsRemainingUntilEndOfMonth)
  } else {
    await csvCountCache.set(
      req.currentTenant.id,
      (parseInt(csvCount, 10) + 1).toString(),
      secondsRemainingUntilEndOfMonth,
    )
  }

  identifyTenant(req)

  track('Member CSV Export', {}, { ...req }, req.currentUser.id)

  await req.responseHandler.success(req, res, payload)
}
