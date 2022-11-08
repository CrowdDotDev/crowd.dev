import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.reportAutocomplete)

  const payload = await new ReportService(req).findAllAutocomplete(req.query.query, req.query.limit)

  await req.responseHandler.success(req, res, payload)
}
