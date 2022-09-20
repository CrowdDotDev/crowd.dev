import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'

/**
 * POST /tenant/{tenantId}/conversation
 * @summary Create a conversation
 * @tag Conversations
 * @security Bearer
 * @description Create a conversation.
 * @pathParam {string} tenantId - Your workspace/tenant ID
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
    new PermissionChecker(req).validateHas(Permissions.values.conversationCreate)

    const payload = await new ConversationService(req).create(req.body)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
