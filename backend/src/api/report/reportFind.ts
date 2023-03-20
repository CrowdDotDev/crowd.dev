import Permissions from '../../security/permissions'
import ReportService from '../../services/reportService'
import PermissionChecker from '../../services/user/permissionChecker'
import track from '../../segment/track'

export default async (req, res) => {
  const reportService = new ReportService(req)
  const payload = await reportService.findById(req.params.id)

  if (!payload.public) {
    new PermissionChecker(req).validateHas(Permissions.values.reportRead)
  }

  if (req.currentUser && req.currentUser.id) {
    const viewedBy = new Set<string>(payload.viewedBy).add(req.currentUser.id)
    await reportService.update(payload.id, { viewedBy: Array.from(viewedBy) })
  }

  track('Report Viewed', { id: payload.id, name: payload.name, public: payload.public }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
