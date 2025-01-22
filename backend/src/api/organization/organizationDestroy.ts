import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /organization/{id}
 * @summary Delete a organization
 * @tag Organizations
 * @security Bearer
 * @description Delete a organization.
 * @pathParam {string} id - The ID of the organization
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationDestroy)

  await new OrganizationService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
