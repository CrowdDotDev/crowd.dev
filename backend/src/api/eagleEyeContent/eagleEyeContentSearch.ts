import Permissions from '../../security/permissions'
import track from '../../segment/track'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentSearch)

  console.log(req.body)

  const payload = await new EagleEyeContentService(req).search(req.body)

  track('EagleEyeSearch', { ...req.body }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
