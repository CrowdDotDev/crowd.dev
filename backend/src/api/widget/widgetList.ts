import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import WidgetService from '../../services/widgetService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.widgetRead)

    const payload = await new WidgetService(req).findAndCountAll(req.query)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
