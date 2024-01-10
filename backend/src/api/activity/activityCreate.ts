import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'
import track from '../../segment/track'

/**
 * POST /tenant/{tenantId}/activity
 * @summary Create or update an activity
 * @tag Activities
 * @security Bearer
 * @description Create or update an activity. Existence is checked by sourceId and tenantId
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {ActivityUpsertInput} application/json
 * @response 200 - Ok
 * @responseContent {Activity} 200.application/json
 * @responseExample {ActivityUpsert} 200.application/json.Activity
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityCreate)

  const payload = await new ActivityService(req).upsert(req.body)

  track('Activity Manually Created', { ...req.body }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
