import { Error403 } from '@crowd/common'
import Permissions from '../../security/permissions'
import track from '../../segment/track'
import ReportService from '../../services/reportService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.reportEdit)
  if (req.body.isTemplate) {
    await req.responseHandler.error(
      req,
      res,
      new Error403(req.language, 'errors.report.templateReportsUpdateNotAllowed'),
    )
    return
  }

  const payload = await new ReportService(req).update(req.params.id, req.body)

  track(
    'Report Updated',
    { id: payload.id, name: payload.name, public: payload.public },
    { ...req },
  )

  await req.responseHandler.success(req, res, payload)
}
