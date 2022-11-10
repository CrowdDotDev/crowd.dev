import Permissions from '../../security/permissions'
import track from '../../segment/track'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)
  const payload = await new EagleEyeContentService(req).findAndCountAll(req.query)

  if (req.query.filter && Object.keys(req.query.filter).length > 0) {
    const platforms = req.query.filter.platforms ? req.query.filter.platforms.split(',') : []
    const nDays = req.query.filter.nDays
    track('Eagle Eye Filter', { filter: req.query.filter, platforms, nDays }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
