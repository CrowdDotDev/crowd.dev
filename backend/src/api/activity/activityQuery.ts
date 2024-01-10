import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'
import track from '../../segment/track'

/**
 * POST /tenant/{tenantId}/activity/query
 * @summary Query activities
 * @tag Activities
 * @security Bearer
 * @description Query activities. It accepts filters, sorting options and pagination.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {ActivityQuery} application/json
 * @response 200 - Ok
 * @responseContent {ActivityList} 200.application/json
 * @responseExample {ActivityList} 200.application/json.Activity
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityRead)

  const payload = await new ActivityService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('Activities Advanced Filter', { ...req.body }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
