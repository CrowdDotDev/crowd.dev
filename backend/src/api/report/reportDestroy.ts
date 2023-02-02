import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'
import PermissionChecker from '../../services/user/permissionChecker'
import track from '../../segment/track'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.reportDestroy)

  await new ReportService(req).destroyAll(req.query.ids)

  track('Report Deleted', { ids: req.query.ids }, { ...req })

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
