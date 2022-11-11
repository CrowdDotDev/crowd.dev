import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import WidgetService from '../../services/widgetService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.widgetDestroy)

  await new WidgetService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
