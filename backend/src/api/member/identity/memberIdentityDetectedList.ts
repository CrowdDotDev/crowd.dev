import MemberIdentityService from '@/services/member/memberIdentityService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * GET /member/:memberIdOrLfid/detected-identity
 * @summary Query detected identities for a given LFID or memberID
 * @tag Members
 * @security Bearer
 * @description Query detected identities for a given LFID or memberID
 * @pathParam {string} memberIdOrLfid - member ID or LFID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.Member
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberIdentityRead)

  const memberIdentityService = new MemberIdentityService(req)

  const payload = await memberIdentityService.detectedList(req.memberId)

  await req.responseHandler.success(req, res, payload)
}
