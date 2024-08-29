import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'
import MemberAffiliationsService from '@/services/member/memberAffiliationsService'

/**
 * PUT /tenant/{tenantId}/member/:memberId/affiliation
 * @summary Upsert member affiliations
 * @tag Members
 * @security Bearer
 * @description Upsert multiple member affiliations.
 * @pathParam {string} tenantId - Your workspace/tenant ID | {string} memberId - member ID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.MemberAffiliation
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const memberAffiliationsService = new MemberAffiliationsService(req)

  const payload = await memberAffiliationsService.upsertMultiple(
    req.params.tenantId,
    req.params.memberId,
    req.body.affiliations,
  )

  await req.responseHandler.success(req, res, payload)
}
