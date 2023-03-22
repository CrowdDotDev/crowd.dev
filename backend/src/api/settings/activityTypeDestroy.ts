import Permissions from '../../security/permissions'
import SettingsService from '../../services/settingsService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /tenant/{tenantId}/settings/activity/types/{key}
 * @summary Destroy an activity type
 * @tag Activities
 * @security Bearer
 * @description Delete an activity type
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {string} key - activity type key to destroy
 * @response 200 - Ok
 * @responseContent {ActivityTypes} 200.application/json
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.settingsEdit)

  const payload = await SettingsService.destroyActivityType(req.params.key, req)

  await req.responseHandler.success(req, res, payload)
}
