import MemberIdentityService from '@/services/member/memberIdentityService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * DELETE /member/:memberId/identity/:identityId
 * @summary Remove member identity
 * @tag Members
 * @security Bearer
 * @description Remove member identity.
 * @pathParam {string} memberId - member ID | {string} identityId - member identity ID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.MemberIdentity
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberIdentityDestroy)

  const memberIdentityService = new MemberIdentityService(req)

  const payload = await memberIdentityService.delete(req.params.id, req.params.memberId)

  await req.responseHandler.success(req, res, payload)
}
