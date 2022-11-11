import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import WidgetService from '../../services/widgetService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.widgetImport)

  await new WidgetService(req).import(req.body, req.body.importHash)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
