import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityImport)

  await new ActivityService(req).import(req.body, req.body.importHash)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
