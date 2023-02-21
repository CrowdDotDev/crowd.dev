import Permissions from '../../security/permissions'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentCreate)

  const payload = await new EagleEyeContentService(req).upsert(req.body)

  await req.responseHandler.success(req, res, payload)
}
