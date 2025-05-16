import MemberIdentityService from '@/services/member/memberIdentityService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * POST /member/:memberIdOrLfid/user-validation
 * @summary Create user validation for member identity
 * @tag Members
 * @security Bearer
 * @description Creates user validation when identity is accepted or rejected.
 * @pathParam {string} memberIdOrLfid - member ID or LFID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.MemberIdentity
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberUserValidationCreate)

  const memberIdentityService = new MemberIdentityService(req)

  const payload = await memberIdentityService.userValidation(req.memberId, req.body)

  await req.responseHandler.success(req, res, payload)
}
