import Permissions from '../../security/permissions'
import track from '../../segment/track'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)

  const payload = await new EagleEyeContentService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('EagleEyeContent Advanced Filter', { ...req.body }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
