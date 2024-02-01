import Permissions from '../../security/permissions'
import track from '../../segment/track'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

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
 * @responseExample {MemberUpsert} 200.application/json.Member
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberCreate)

  const payload = await new MemberService(req).upsert(req.body)

  track('Member Manually Created', { ...req.body }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
