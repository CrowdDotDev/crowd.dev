import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import track from '../../segment/track'

// /**
//  * POST /tenant/{tenantId}/eagleEyeContent
//  * @summary Create or update an eagleEyeContent
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an eagleEyeContent. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {EagleEyeContentUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {EagleEyeContent} 200.application/json
//  * @responseExample {EagleEyeContentUpsert} 200.application/json.EagleEyeContent
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)

    const payload = await new EagleEyeContentService(req).query(req.body)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('EagleEyeContent Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
