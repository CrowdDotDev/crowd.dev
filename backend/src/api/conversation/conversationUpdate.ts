import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /conversation/{id}
 * @summary Update an conversation
 * @tag Conversations
 * @security Bearer
 * @description Update a conversation given an ID.
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
  new PermissionChecker(req).validateHas(Permissions.values.conversationEdit)

  const payload = await new ConversationService(req).update(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
