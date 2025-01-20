import Permissions from '../../security/permissions'
import TagService from '../../services/tagService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /tag/{id}
 * @summary Delete a tag
 * @tag Tags
 * @security Bearer
 * @description Delete a tag.
 * @pathParam {string} id - The ID of the tag
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tagDestroy)

  await new TagService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
