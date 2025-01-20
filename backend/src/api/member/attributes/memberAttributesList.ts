import MemberAttributesService from '@/services/member/memberAttributesService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * GET /member/:memberId/attributes
 * @summary Query member attributes
 * @tag Members
 * @security Bearer
 * @description Query member attributes.
 * @pathParam {string} memberId - member ID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.Attributes
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const memberAttributesService = new MemberAttributesService(req)

  const payload = await memberAttributesService.list(req.params.memberId)

  await req.responseHandler.success(req, res, payload)
}
