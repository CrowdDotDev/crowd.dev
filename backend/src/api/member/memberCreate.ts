import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import track from '../../segment/track'

/**
 * POST /tenant/{tenantId}/member
 * @summary Create or update a member
 * @tag Members
 * @security Bearer
 * @description Create or update a member. Existence is checked by platform and username.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {MemberUpsertInput} application/json
 * @response 200 - Ok
 * @responseContent {Member} 200.application/json
 * @responseExample {Member} 200.application/json.Member
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberCreate)

    const payload = await new MemberService(req).upsert(req.body)

    track('Member Manually Created', { ...payload }, { ...req })

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
