import Permissions from '../../security/permissions'
import EagleEyeSettingsService from '../../services/eagleEyeSettingsService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeActionCreate)

  const payload = await new EagleEyeSettingsService(req).update(req.body)

  await req.responseHandler.success(req, res, payload)
}
