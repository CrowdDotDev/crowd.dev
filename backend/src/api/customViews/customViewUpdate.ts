import Permissions from '../../security/permissions'
import CustomViewService from '../../services/customViewService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /tenant/{tenantId}/customview/{id}
 * @summary Update an custom view
 * @tag CustomViews
 * @security Bearer
 * @description Update an custom view given an ID.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the custom view
 * @bodyContent {CustomViewUpsertInput} application/json
 * @response 200 - Ok
 * @responseContent {CustomView} 200.application/json
 * @responseExample {CustomViewFind} 200.application/json.CustomView
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.customViewEdit)

  const payload = await new CustomViewService(req).update(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
