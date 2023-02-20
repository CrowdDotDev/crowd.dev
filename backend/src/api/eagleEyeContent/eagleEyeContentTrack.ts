import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import EagleEyeContentService from '../../services/eagleEyeContentService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)
  
  EagleEyeContentService.trackPostClicked(req.body.url, req.body.platform, req)

  const out = {
    Success: true,
  }

  await req.responseHandler.success(req, res, out)
}
