import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import TagService from '../../services/tagService'
import track from '../../segment/track'

// /**
//  * POST /tenant/{tenantId}/tag
//  * @summary Create or update an tag
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an tag. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {TagUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Tag} 200.application/json
//  * @responseExample {TagUpsert} 200.application/json.Tag
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.tagRead)

    const payload = await new TagService(req).query(req.body.data)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Tags Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
