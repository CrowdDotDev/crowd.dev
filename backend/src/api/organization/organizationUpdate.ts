import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /tenant/{tenantId}/organization/{id}
 * @summary Update an organization
 * @tag Organizations
 * @security Bearer
 * @description Update a organization
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the organization
 * @bodyContent {OrganizationInput} application/json
 * @response 200 - Ok
 * @responseContent {Organization} 200.application/json
 * @responseExample {OrganizationCreate} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationEdit)

  const payload = await new OrganizationService(req).update(
    req.params.id,
    req.body,
    true,
    true,
    true,
  )

  await req.responseHandler.success(req, res, payload)
}
