import Permissions from '../../security/permissions'
import SettingsService from '../../services/settingsService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * TODO: Update
 * PUT /tenant/{tenantId}/settings/activity/types/{key}
 * @summary Attribute settings: update
 * @tag Activities
 * @security Bearer
 * @description Update a custom activity type
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} key - The key of the activity type
 * @bodyContent {ActivityTypesUpdateInput} application/json
 * @response 200 - Ok
 * @responseContent {ActivityTypes} 200.application/json
 * @responseExample {ActivityTypes} 200.application/json.ActivityTypes
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.settingsEdit)

  const payload = await SettingsService.updateActivityType(req.params.key, req.body, req)

  await req.responseHandler.success(req, res, payload)
}
