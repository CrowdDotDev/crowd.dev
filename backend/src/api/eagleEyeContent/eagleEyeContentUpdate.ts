import Permissions from '../../security/permissions'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentEdit)

  const payload = await new EagleEyeContentService(req).update(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
