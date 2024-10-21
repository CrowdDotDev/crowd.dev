import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /tenant/{tenantId}/activity/{id}
 * @summary Update an activity
 * @tag Activities
 * @security Bearer
 * @description Update an activity given an ID.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the activity
 * @bodyContent {ActivityUpsertInput} application/json
 * @response 200 - Ok
 * @responseContent {Activity} 200.application/json
 * @responseExample {ActivityFind} 200.application/json.Activity
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityEdit)

  const payload = await new ActivityService(req).update(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
