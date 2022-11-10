import Permissions from '../../security/permissions'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)

  const payload = await new EagleEyeContentService(req).findById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
