import Permissions from '../../security/permissions'
import EagleEyeActionService from '../../services/eagleEyeActionService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeActionCreate)

  const payload = await new EagleEyeActionService(req).create(req.body, req.params.contentId)

  await req.responseHandler.success(req, res, payload)
}
