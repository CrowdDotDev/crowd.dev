import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import WidgetService from '../../services/widgetService'
import track from '../../segment/track'

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
  try {
    new PermissionChecker(req).validateHas(Permissions.values.widgetRead)

    const payload = await new WidgetService(req).query(req.body.data)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Widgets Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
