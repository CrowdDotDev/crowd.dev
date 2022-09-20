import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ConversationService from '../../services/conversationService'
import track from '../../segment/track'

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
  try {
    new PermissionChecker(req).validateHas(Permissions.values.conversationRead)

    const payload = await new ConversationService(req).query(req.body)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Conversations Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
