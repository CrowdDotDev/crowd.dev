import OrganizationService from '@/services/organizationService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /organization/list
 * @summary List organizations across all segments
 * @tag Organizations
 * @security Bearer
 * @description List organizations across all segments. It accepts filters, sorting options and pagination.
 * @bodyContent {OrganizationQuery} application/json
 * @response 200 - Ok
 * @responseContent {OrganizationList} 200.application/json
 * @responseExample {OrganizationList} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationRead)

  const orgService = new OrganizationService(req)
  const payload = await orgService.listOrganizationsAcrossAllSegments(req.body)

  await req.responseHandler.success(req, res, payload)
}
