import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import WidgetService from '../../services/widgetService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.widgetAutocomplete)

  const payload = await new WidgetService(req).findAllAutocomplete(req.query.query, req.query.limit)

  await req.responseHandler.success(req, res, payload)
}
