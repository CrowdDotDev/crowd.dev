import Permissions from '../../security/permissions'
import track from '../../segment/track'
import ConversationService from '../../services/conversationService'
import PermissionChecker from '../../services/user/permissionChecker'

// /**
//  * POST /tenant/{tenantId}/conversation
//  * @summary Create or update an conversation
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an conversation. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {ConversationUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Conversation} 200.application/json
//  * @responseExample {ConversationUpsert} 200.application/json.Conversation
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.conversationRead)

  const payload = await new ConversationService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('Conversations Advanced Filter', { ...payload }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
