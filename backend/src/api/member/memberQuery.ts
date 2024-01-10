import Permissions from '../../security/permissions'
import track from '../../segment/track'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /tenant/{tenantId}/member/query
 * @summary Query members
 * @tag Members
 * @security Bearer
 * @description Query members. It accepts filters, sorting options and pagination.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {MemberQuery} application/json
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.Member
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  let payload
  const newVersion = req.headers['x-crowd-api-version'] === '1'

  const memberService = new MemberService(req)

  if (newVersion) {
    payload = await memberService.queryV2(req.body)
  } else {
    payload = await memberService.query(req.body)
  }

  if (req.body.filter && Object.keys(req.body.filter).length > 0) {
    track('Member Advanced Filter', { ...req.body }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
