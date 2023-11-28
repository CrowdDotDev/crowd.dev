import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'

/**
 * GET /tenant/{tenantId}/activity/{id}
 * @summary Find an activity
 * @tag Activities
 * @security Bearer
 * @description Find a single activity by ID
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the activity
 * @response 200 - Ok
 * @responseContent {ActivityResponse} 200.application/json
 * @responseExample {ActivityFind} 200.application/json.Activity
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityRead)

  const payload = await new ActivityService(req).findActivityTypes(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
