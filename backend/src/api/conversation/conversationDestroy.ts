import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /conversation/{id}
 * @summary Delete a conversation
 * @tag Conversations
 * @security Bearer
 * @description Delete a conversation.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the conversation
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.conversationDestroy)

  await new ConversationService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
