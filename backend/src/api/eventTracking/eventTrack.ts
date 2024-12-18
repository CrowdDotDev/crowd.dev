import Permissions from '../../security/permissions'
import EventTrackingService from '../../services/eventTrackingService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.quickstartGuideRead)

  const payload = await new EventTrackingService(req).trackEvent(req.body)

  await req.responseHandler.success(req, res, payload)
}
