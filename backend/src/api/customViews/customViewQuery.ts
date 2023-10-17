import Permissions from '../../security/permissions'
import CustomViewService from '../../services/customViewService'
import PermissionChecker from '../../services/user/permissionChecker'
import track from '../../segment/track'

/**
 * GET /tenant/{tenantId}/customview/query
 * @summary Query custom views
 * @tag CustomViews
 * @security Bearer
 * @description Query custom views. It accepts filters and sorting options.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {string[]} placement - The placements to filter by
 * @queryParam {string} visibility - The visibility to filter by
 * @response 200 - Ok
 * @responseContent {CustomViewList} 200.application/json
 * @responseExample {CustomViewList} 200.application/json.CustomView
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityRead)

  const payload = await new CustomViewService(req).findAll(req.query)

  if (req.query.filter && Object.keys(req.query.filter).length > 0) {
    track('Custom views Filter', { ...payload }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
