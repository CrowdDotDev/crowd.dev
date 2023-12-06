import Permissions from '../../security/permissions'
import track from '../../segment/track'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeActionCreate)

  const payload = await new EagleEyeContentService(req).search()
  track('EagleEye backend search', {}, { ...req })
  await req.responseHandler.success(req, res, payload)
}
