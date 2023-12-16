import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/member/{id}
 * @summary Find a member
 * @tag Members
 * @security Bearer
 * @description Find a single member by ID.
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
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const payload = await new MemberService(req).findGithub(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
