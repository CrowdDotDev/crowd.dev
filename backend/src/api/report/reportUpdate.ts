import Permissions from '../../security/permissions'
import track from '../../segment/track'
import ReportService from '../../services/reportService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.reportEdit)

  const payload = await new ReportService(req).update(req.params.id, req.body)

  track(
    'Report Updated',
    { id: payload.id, name: payload.name, public: payload.public },
    { ...req },
  )

  await req.responseHandler.success(req, res, payload)
}
