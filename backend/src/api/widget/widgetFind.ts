import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import WidgetService from '../../services/widgetService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.widgetRead)

  const payload = await new WidgetService(req).findById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
