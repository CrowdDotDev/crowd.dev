import MemberOrganizationsService from '@/services/member/memberOrganizationsService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * POST /tenant/{tenantId}/member/:memberId/organization
 * @summary Create member organization
 * @tag Members
 * @security Bearer
 * @description Create one member organization.
 * @pathParam {string} tenantId - Your workspace/tenant ID | {string} memberId - member ID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const memberOrganizationsService = new MemberOrganizationsService(req)

  const payload = await memberOrganizationsService.create(req.params.memberId, req.body)

  await req.responseHandler.success(req, res, payload)
}
