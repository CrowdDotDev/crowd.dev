import Permissions from '../../security/permissions'
import SettingsService from '../../services/settingsService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * TODO: Update
 * POST /tenant/{tenantId}/settings/activity/types
 * @summary Activity type: create
 * @tag Activities
 * @security Bearer
 * @description Create a custom activity type
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {ActivityTypesCreateInput} application/json
 * @response 200 - Ok
 * @responseContent {ActivityTypes} 200.application/json
 * @responseExample {ActivityTypes} 200.application/json.ActivityTypes
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.settingsEdit)

  const payload = await SettingsService.createActivityType(req.body, req)

  await req.responseHandler.success(req, res, payload)
}
