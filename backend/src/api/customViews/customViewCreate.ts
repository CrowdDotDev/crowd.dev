import Permissions from '../../security/permissions'
import track from '../../segment/track'
import CustomViewService from '../../services/customViewService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /tenant/{tenantId}/customview
 * @summary Create a custom view
 * @tag CustomViews
 * @security Bearer
 * @description Create a custom view
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {CustomViewInput} application/json
 * @response 200 - Ok
 * @responseContent {CustomView} 200.application/json
 * @responseExample {CustomViewCreate} 200.application/json.CustomView
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.customViewCreate)

  const payload = await new CustomViewService(req).create(req.body)

  track('Custom view Manually Created', { ...payload }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
