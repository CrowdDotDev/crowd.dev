import MemberAffiliationsService from '@/services/member/memberAffiliationsService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/member/:memberId/affiliation
 * @summary List member affiliations
 * @tag Members
 * @security Bearer
 * @description Query member affiliations.
 * @pathParam {string} tenantId - Your workspace/tenant ID | {string} memberId - member ID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.MemberAffiliation
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const memberAffiliationsService = new MemberAffiliationsService(req)

  const payload = await memberAffiliationsService.list(req.params.memberId)

  await req.responseHandler.success(req, res, payload)
}
