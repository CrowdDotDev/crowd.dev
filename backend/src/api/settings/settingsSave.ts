import Permissions from '../../security/permissions'
import SettingsService from '../../services/settingsService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.settingsEdit)

  const payload = await SettingsService.save(req.body.settings, req)

  await req.responseHandler.success(req, res, payload)
}
