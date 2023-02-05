import Permissions from '../../security/permissions'
import EagleEyeActionService from '../../services/eagleEyeActionService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeActionDestroy)

  const payload = await new EagleEyeActionService(req).destroy(req.params.actionId)

  await req.responseHandler.success(req, res, payload)
}
