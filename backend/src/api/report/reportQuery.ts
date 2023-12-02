import Permissions from '../../security/permissions'
import track from '../../segment/track'
import ReportService from '../../services/reportService'
import PermissionChecker from '../../services/user/permissionChecker'

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
  new PermissionChecker(req).validateHas(Permissions.values.reportRead)

  const payload = await new ReportService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('Reports Advanced Filter', { ...payload }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
