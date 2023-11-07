import Permissions from '../../security/permissions'
import track from '../../segment/track'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /tenant/{tenantId}/organization/query
 * @summary Query organizations
 * @tag Organizations
 * @security Bearer
 * @description Query organizations. It accepts filters, sorting options and pagination.
 * @pathParam {string} tenantId - Your workspace/tenant ID
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

  const payload = await new OrganizationService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('Organizations Advanced Filter', { ...payload }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
