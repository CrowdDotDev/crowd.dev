import CustomViewService from '@/services/customViewService'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /tenant/{tenantId}/customview
 * @summary Update custom views in bulk
 * @tag CustomViews
 * @security Bearer
 * @description Update custom view of given an IDs.
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

  const customViewsToUpdate = req.body

  const customViewService = new CustomViewService(req)

  const promises = customViewsToUpdate.map((item) => customViewService.update(item.id, item))

  const payload = await Promise.all(promises)
  await req.responseHandler.success(req, res, payload)
}
