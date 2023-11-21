import Permissions from '../../security/permissions'
import track from '../../segment/track'
import PermissionChecker from '../../services/user/permissionChecker'
import WidgetService from '../../services/widgetService'

// /**
//  * POST /tenant/{tenantId}/widget
//  * @summary Create or update an widget
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an widget. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {WidgetUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Widget} 200.application/json
//  * @responseExample {WidgetUpsert} 200.application/json.Widget
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.widgetRead)

  const payload = await new WidgetService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('Widgets Advanced Filter', { ...payload }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
