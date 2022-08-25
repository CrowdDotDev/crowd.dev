import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import EagleEyeContentService from '../../services/eagleEyeContentService'
import track from '../../segment/track'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)
    const payload = await new EagleEyeContentService(req).findAndCountAll(req.query)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      const platforms = req.query.filter.platforms ? req.query.filter.platforms.split(',') : []
      const nDays = req.query.filter.nDays
      track('Eagle Eye Filter', { filter: req.query.filter, platforms, nDays }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
