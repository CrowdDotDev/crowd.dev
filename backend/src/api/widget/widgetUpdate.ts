import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import WidgetService from '../../services/widgetService'
import track from '../../segment/track'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.widgetEdit)

    const payload = await new WidgetService(req).update(req.params.id, req.body.data)

    track(
      'Widget Updated',
      {
        id: payload.id,
        reportId: payload.report ? payload.report.id : undefined,
      },
      { ...req },
    )

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
