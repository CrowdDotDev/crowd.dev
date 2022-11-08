import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.reportRead)

  const payload = await new ReportService(req).findAndCountAll(req.query)

  await req.responseHandler.success(req, res, payload)
}
