import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import OrganizationService from '@/services/organizationService'

/**
 * GET /tenant/{tenantId}/organizations
 * @summary List organizations across all segments
 * @tag Organizations
 * @security Bearer
 * @description List organizations across all segments. It accepts filters, sorting options and pagination.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {string} [filter] - Filter criteria
 * @queryParam {string} [orderBy] - Sorting options
 * @queryParam {number} [limit] - Maximum number of organizations to return
 * @queryParam {number} [offset] - Number of organizations to skip before
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
  const payload = await orgService.listOrganizationsAcrossAllSegments(req.query)

  await req.responseHandler.success(req, res, payload)
}
