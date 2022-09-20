import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'
import track from '../../segment/track'

// /**
//  * POST /tenant/{tenantId}/report
//  * @summary Create or update an report
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an report. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {ReportUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Report} 200.application/json
//  * @responseExample {ReportUpsert} 200.application/json.Report
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.reportRead)

    const payload = await new ReportService(req).query(req.body.data)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Reports Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
