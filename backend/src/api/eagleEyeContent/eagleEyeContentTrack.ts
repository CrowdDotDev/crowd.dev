import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import track from '../../segment/track'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)
  track(
    'Eagle Eye post click',
    {
      url: req.body.url,
      platform: req.body.platform,
    },
    { ...req },
  )

  const out = {
    Success: true,
  }

  await req.responseHandler.success(req, res, out)
}
