import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import TagService from '../../services/tagService'

/**
 * PUT /tenant/{tenantId}/tag/{id}
 * @summary Update an tag
 * @tag Tags
 * @security Bearer
 * @description Update a tag given an ID.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the tag
 * @bodyContent {TagNoId} application/json
 * @response 200 - Ok
 * @responseContent {Tag} 200.application/json
 * @responseExample {Tag} 200.application/json.Tag
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.tagEdit)

    const payload = await new TagService(req).update(req.params.id, req.body.data)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
