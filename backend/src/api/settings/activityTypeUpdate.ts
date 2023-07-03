import Permissions from '../../security/permissions'
import SegmentService from '../../services/segmentService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /tenant/{tenantId}/settings/activity/types/{key}
 * @summary Update an activity type
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
  new PermissionChecker(req).validateHas(Permissions.values.segmentEdit)

  const payload = await new SegmentService(req).updateActivityType(req.params.key, req.body)

  await req.responseHandler.success(req, res, payload)
}
