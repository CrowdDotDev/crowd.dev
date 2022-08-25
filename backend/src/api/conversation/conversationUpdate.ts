import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'

/**
 * PUT /tenant/{tenantId}/conversation/{id}
 * @summary Update an conversation
 * @tag Conversations
 * @security Bearer
 * @description Update a conversation given an ID.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the conversation
 * @bodyContent {ConversationNoId} application/json
 * @response 200 - Ok
 * @responseContent {Conversation} 200.application/json
 * @responseExample {Conversation} 200.application/json.Conversation
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.conversationEdit)

    const payload = await new ConversationService(req).update(req.params.id, req.body.data)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
