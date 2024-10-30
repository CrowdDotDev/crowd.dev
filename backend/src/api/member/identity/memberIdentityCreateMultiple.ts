import MemberIdentityService from '@/services/member/memberIdentityService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * PUT /tenant/{tenantId}/member/:memberId/identity
 * @summary Create member identities
 * @tag Members
 * @security Bearer
 * @description Create multiple member identity.
 * @pathParam {string} tenantId - Your workspace/tenant ID | {string} memberId - member ID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.MemberIdentity
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const memberIdentityService = new MemberIdentityService(req)

  const payload = await memberIdentityService.createMultiple(
    req.params.tenantId,
    req.params.memberId,
    req.body.identities,
  )

  await req.responseHandler.success(req, res, payload)
}
