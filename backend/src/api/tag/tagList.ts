import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import TagService from '../../services/tagService'

/**
 * GET /tenant/{tenantId}/tag
 * @summary List tags
 * @tag Tags
 * @security Bearer
 * @description Get a list of tags with filtering, sorting and offsetting.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {string} [filter[name]] - Filter by the name of the tag.
 * @queryParam {string} [filter[createdAtRange]] - Created at lower bound. If you want a range, send this parameter twice with [min] and [max]. If you send it once it will be interpreted as a lower bound.
 * @queryParam {TagSort} [orderBy] - Sort the results. Default timestamp_DESC.
 * @queryParam {number} [offset] - Skip the first n results. Default 0.
 * @queryParam {number} [limit] - Limit the number of results. Default 50.
 * @response 200 - Ok
 * @responseContent {TagList} 200.application/json
 * @responseExample {TagList} 200.application/json.Tags
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.tagRead)

    const payload = await new TagService(req).findAndCountAll(req.query)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
