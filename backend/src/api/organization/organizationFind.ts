import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /organization/{id}
 * @summary Find an organization
 * @tag Organizations
 * @security Bearer
 * @description Find an organization by ID.
 * @pathParam {string} id - The ID of the organization
 * @response 200 - Ok
 * @responseContent {OrganizationResponse} 200.application/json
 * @responseExample {Organization} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationRead)

  const segmentId = req.query.segmentId
  const payload = await new OrganizationService(req).findById(req.params.id, segmentId)

  await req.responseHandler.success(req, res, payload)
}
