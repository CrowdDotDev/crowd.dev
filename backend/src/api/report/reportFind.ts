import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  const payload = await new ReportService(req).findById(req.params.id)

  if (!payload.public) {
    new PermissionChecker(req).validateHas(Permissions.values.reportRead)
  }

  await req.responseHandler.success(req, res, payload)
}
