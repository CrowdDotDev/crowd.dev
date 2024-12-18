import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /tenant/{tenantId}/activity/{id}
 * @summary Delete an activity
 * @tag Activities
 * @security Bearer
 * @description Delete a activity given an ID
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the activity
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityDestroy)

  await new ActivityService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
