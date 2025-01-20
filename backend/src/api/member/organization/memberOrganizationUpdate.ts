import MemberOrganizationsService from '@/services/member/memberOrganizationsService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * PATCH /member/:memberId/organization/:memberOrganizationId
 * @summary Update member organization
 * @tag Members
 * @security Bearer
 * @description Update member organization.
 * @pathParam {string} memberId - member ID | {string} memberOrganizationId - member organization ID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const memberOrganizationsService = new MemberOrganizationsService(req)

  const payload = await memberOrganizationsService.update(
    req.params.id,
    req.params.memberId,
    req.body,
  )

  await req.responseHandler.success(req, res, payload)
}
