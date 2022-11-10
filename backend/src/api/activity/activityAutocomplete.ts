import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityAutocomplete)

  const payload = await new ActivityService(req).findAllAutocomplete(
    req.query.query,
    req.query.limit,
  )

  await req.responseHandler.success(req, res, payload)
}
