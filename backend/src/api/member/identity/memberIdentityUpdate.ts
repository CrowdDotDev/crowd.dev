import MemberIdentityService from '@/services/member/memberIdentityService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * PATCH /tenant/{tenantId}/member/:memberId/identity/:identityId
 * @summary Update member identity
 * @tag Members
 * @security Bearer
 * @description Update member identity.
 * @pathParam {string} tenantId - Your workspace/tenant ID | {string} memberId - member ID | {string} identityId - member identity ID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.MemberIdentity
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const memberIdentityService = new MemberIdentityService(req)

  const payload = await memberIdentityService.update(req.params.id, req.params.memberId, req.body)

  await req.responseHandler.success(req, res, payload)
}
