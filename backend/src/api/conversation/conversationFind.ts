import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /conversation/{id}
 * @summary Find a conversation
 * @tag Conversations
 * @security Bearer
 * @description Find a conversation by ID.
 * @pathParam {string} id - The ID of the conversation.
 * @response 200 - Ok
 * @responseContent {Conversation} 200.application/json
 * @responseExample {Conversation} 200.application/json.Conversation
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.conversationRead)

  const payload = await new ConversationService(req).findById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
