import Permissions from '../../security/permissions'
import track from '../../segment/track'
import PermissionChecker from '../../services/user/permissionChecker'
import WidgetService from '../../services/widgetService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.widgetCreate)

  const payload = await new WidgetService(req).create(req.body)

  track(
    'Widget Created',
    {
      id: payload.id,
      reportId: payload.report ? payload.report.id : undefined,
    },
    { ...req },
  )

  await req.responseHandler.success(req, res, payload)
}
