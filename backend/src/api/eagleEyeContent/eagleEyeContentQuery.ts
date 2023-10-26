import Permissions from '../../security/permissions'
import track from '../../segment/track'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import PermissionChecker from '../../services/user/permissionChecker'

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
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)

  const payload = await new EagleEyeContentService(req).query(req.body)

  if (req.query.filter && Object.keys(req.query.filter).length > 0) {
    track('EagleEyeContent Advanced Filter', { ...payload }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
