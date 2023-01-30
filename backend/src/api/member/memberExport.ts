import moment from 'moment'
import Permissions from '../../security/permissions'
import identifyTenant from '../../segment/identifyTenant'
import track from '../../segment/track'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'
import { FeatureFlagRedisKey } from '../../types/common'
import { RedisCache } from '../../utils/redis/redisCache'

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

  const csvCountCache = new RedisCache(FeatureFlagRedisKey.CSV_EXPORT_COUNT, req.redis)

  const csvCount = await csvCountCache.getValue(req.currentTenant.id)

  const endTime = moment().endOf('month')
  const startTime = moment()

  const secondsRemainingUntilEndOfMonth = endTime.diff(startTime, 'days') * 86400

  if (!csvCount) {
    await csvCountCache.setValue(req.currentTenant.id, '0', secondsRemainingUntilEndOfMonth)
  } else {
    await csvCountCache.setValue(
      req.currentTenant.id,
      (parseInt(csvCount, 10) + 1).toString(),
      secondsRemainingUntilEndOfMonth,
    )
  }

  identifyTenant(req)

  track('Member CSV Export', {}, { ...req }, req.currentUser.id)

  await req.responseHandler.success(req, res, payload)
}
