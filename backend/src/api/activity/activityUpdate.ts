import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'

/**
 * PUT /tenant/{tenantId}/activity/{id}
 * @summary Update an activity
 * @tag Activities
 * @security Bearer
 * @description Update an activity given an ID.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the activity
 * @bodyContent {ActivityNoId} application/json
 * @response 200 - Ok
 * @responseContent {Activity} 200.application/json
 * @responseExample {ActivityFind} 200.application/json.Activity
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.activityEdit)

    const payload = await new ActivityService(req).update(req.params.id, req.body)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
