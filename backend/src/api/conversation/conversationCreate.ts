import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /conversation
 * @summary Create a conversation
 * @tag Conversations
 * @security Bearer
 * @description Create a conversation.
 * @bodyContent {ConversationNoId} application/json
 * @response 200 - Ok
 * @responseContent {Conversation} 200.application/json
 * @responseExample {Conversation} 200.application/json.Conversation
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.conversationCreate)

  const payload = await new ConversationService(req).create(req.body)

  await req.responseHandler.success(req, res, payload)
}
