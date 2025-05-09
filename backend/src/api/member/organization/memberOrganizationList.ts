import MemberOrganizationsService from '@/services/member/memberOrganizationsService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * GET /member/:memberIdOrLfid/organization
 * @summary Query member organizations
 * @tag Members
 * @security Bearer
 * @description Query member organization.
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberOrganizationRead)

  const memberOrganizationsService = new MemberOrganizationsService(req)

  const payload = await memberOrganizationsService.list(req.memberId)

  await req.responseHandler.success(req, res, payload)
}
