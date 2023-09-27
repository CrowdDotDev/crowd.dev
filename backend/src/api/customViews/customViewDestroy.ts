import Permissions from '../../security/permissions'
import CustomViewService from '../../services/customViewService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /tenant/{tenantId}/customview/{id}
 * @summary Delete an custom view
 * @tag CustomViews
 * @security Bearer
 * @description Delete a custom view given an ID
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the custom view
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.customViewDestroy)

  await new CustomViewService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
