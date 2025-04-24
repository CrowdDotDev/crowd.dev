import MemberOrganizationsService from '@/services/member/memberOrganizationsService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * POST /member/:memberIdOrLfid/organization/user-validation
 * @summary Create user validation for member organization
 * @tag Members
 * @security Bearer
 * @description Creates user validation when organization is created, updated or deleted.
 * @pathParam {string} memberIdOrLfid - member ID or LFID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberUserValidationCreate)

  const memberOrganizationsService = new MemberOrganizationsService(req)

  const payload = await memberOrganizationsService.userValidation(req.memberId, req.body)

  await req.responseHandler.success(req, res, payload)
}
