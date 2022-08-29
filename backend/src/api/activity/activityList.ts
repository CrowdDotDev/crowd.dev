import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'
import track from '../../segment/track'

/**
 * GET /tenant/{tenantId}/activity
 * @summary List activities
 * @tag Activities
 * @security Bearer
 * @description Get a list of activities with filtering, sorting and offsetting.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {string} [filter[type]] - Filter by type of activity.
 * @queryParam {string} [filter[platform]] - Filter by any field in the username object having the platform.
 * @queryParam {string} [filter[timestampRange]] - Timestamp lower bound. If you want a range, send this parameter twice with [min] and [max]. If you send it once it will be interpreted as a lower bound.
 * @queryParam {int32} [filter[scoreRange]] - Score lower bound. If you want a range, send this parameter twice with [min] and [max]. If you send it once it will be interpreted as a lower bound.
 * @queryParam {string} [filter[memberId]] - Filter by member. This would yield all the activities of the member.
 * @queryParam {string} [filter[parent]] - Filter by parent. This would yield all the children of the parent.
 * @queryParam {string} [filter[conversationId]] - Filter by conversation. This would yield all activities in the conversation.
 * @queryParam {string} [filter[createdAtRange]] - CreatedAt lower bound. If you want a range, send this parameter twice with [min] and [max]. If you send it once it will be interpreted as a lower bound.
 * @queryParam {ActivitySort} [orderBy] - Sort the results. Default timestamp_DESC.
 * @queryParam {number} [offset] - Skip the first n results. Default 0.
 * @queryParam {number} [limit] - Limit the number of results. Default 50.
 * @response 200 - Ok
 * @responseContent {ActivityList} 200.application/json
 * @responseExample {ActivityList} 200.application/json.Activities
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.activityRead)

    const payload = await new ActivityService(req).findAndCountAll(req.query)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Activities Filtered', { filter: req.query.filter }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
