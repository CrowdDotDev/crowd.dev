import Permissions from '../../security/permissions'
import track from '../../segment/track'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/conversation
 * @summary List conversations
 * @tag Conversations
 * @security Bearer
 * @description Get a list of conversations with filtering, sorting and offsetting.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {string} [filter[title]] - Filter by the title of the conversation.
 * @queryParam {string} [filter[slug]] - Filter by the slug of the conversation.
 * @queryParam {string} [filter[published]] - Filter by whether it is published or not.
 * @queryParam {string} [filter[platform]] - Filter by the platform of the conversation.
 * @queryParam {string} [filter[channel]] - Filter by the channel of the conversation.
 * @queryParam {string} [filter[activitiesCountRange]] - activitiesCount lower bound. If you want a range, send this parameter twice with [min] and [max]. If you send it once it will be interpreted as a lower bound.
 * @queryParam {string} [filter[createdAtRange]] - Send this parameter twice with [min] and [max].
 * @queryParam {ConversationSort} [orderBy] - Sort the results. Default timestamp_DESC.
 * @queryParam {number} [offset] - Skip the first n results. Default 0.
 * @queryParam {number} [limit] - Limit the number of results. Default 50.
 * @response 200 - Ok
 * @responseContent {ConversationList} 200.application/json
 * @responseExample {ConversationList} 200.application/json.Conversations
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.conversationRead)

  const payload = await new ConversationService(req).findAndCountAll(req.query)

  if (req.query.filter && Object.keys(req.query.filter).length > 0) {
    track('Conversations Filtered', { filter: req.query.filter }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
