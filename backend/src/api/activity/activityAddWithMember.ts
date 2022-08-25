import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'

/**
 * POST /tenant/{tenantId}/add-activity
 * @summary Create or update an activity with a member
 * @tag Activities
 * @security Bearer
 * @description Create or update an activity with a community member.
 * Activity existence is checked by sourceId and tenantId.
 * Community member existence is checked by platform and username.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {ActivityUpsertWithMemberInput} application/json
 * @response 200 - Ok
 * @responseContent {Activity} 200.application/json
 * @responseExample {ActivityUpsert} 200.application/json.Activity
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    // Check we have the Create permisions
    new PermissionChecker(req).validateHas(Permissions.values.activityCreate)
    // Call the createWithMember function in activity service
    // to create the activity.
    const payload = await new ActivityService(req).createWithMember(req.body.data)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
