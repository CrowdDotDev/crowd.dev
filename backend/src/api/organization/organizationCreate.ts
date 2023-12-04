import Permissions from '../../security/permissions'
import track from '../../segment/track'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /tenant/{tenantId}/organization
 * @summary Create a organization
 * @tag Organizations
 * @security Bearer
 * @description Create a organization
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {OrganizationInput} application/json
 * @response 200 - Ok
 * @responseContent {Organization} 200.application/json
 * @responseExample {OrganizationCreate} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationCreate)

  const payload = await new OrganizationService(req).createOrUpdate(req.body)

  track('Organization Manually Created', { ...payload }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
