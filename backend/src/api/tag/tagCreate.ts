import Permissions from '../../security/permissions'
import TagService from '../../services/tagService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /tag
 * @summary Create a tag
 * @tag Tags
 * @security Bearer
 * @description Create a tag
 * @bodyContent {TagNoId} application/json
 * @response 200 - Ok
 * @responseContent {Tag} 200.application/json
 * @responseExample {Tag} 200.application/json.Tag
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tagCreate)

  const payload = await new TagService(req).create(req.body)

  await req.responseHandler.success(req, res, payload)
}
