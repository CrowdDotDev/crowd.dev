import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'

/**
 * GET /tenant/{tenantId}/conversation/{id}
 * @summary Find a conversation
 * @tag Conversations
 * @security Bearer
 * @description Find a conversation by ID.
 * @pathParam {string} tenantId - Your workspace/tenant ID.
 * @pathParam {string} id - The ID of the conversation.
 * @response 200 - Ok
 * @responseContent {Conversation} 200.application/json
 * @responseExample {Conversation} 200.application/json.Conversation
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.conversationRead)

    const payload = await new ConversationService(req).findById(req.params.id)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
