import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'
import PermissionChecker from '../../services/user/permissionChecker'
import track from '../../segment/track'

export default async (req, res) => {
  const payload = await new ReportService(req).findById(req.params.id)

  if (!payload.public) {
    new PermissionChecker(req).validateHas(Permissions.values.reportRead)
  }

  track('Report Viewed', { id: payload.id, name: payload.name, public: payload.public }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
