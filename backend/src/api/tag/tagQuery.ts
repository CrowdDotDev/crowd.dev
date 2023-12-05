import Permissions from '../../security/permissions'
import track from '../../segment/track'
import TagService from '../../services/tagService'
import PermissionChecker from '../../services/user/permissionChecker'

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
  new PermissionChecker(req).validateHas(Permissions.values.tagRead)

  const payload = await new TagService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('Tags Advanced Filter', { ...req.body }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
