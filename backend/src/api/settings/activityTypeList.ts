import Permissions from '../../security/permissions'
import SettingsService from '../../services/settingsService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/settings/activity/types
 * @summary List all activity types
 * @tag Activities
 * @security Bearer
 * @description List all activity types
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @response 200 - Ok
 * @responseContent {ActivityTypes} 200.application/json
 * @responseExample {ActivityTypes} 200.application/json.ActivityTypes
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.settingsRead)

  const payload = SettingsService.listActivityTypes(req)

  await req.responseHandler.success(req, res, payload)
}
