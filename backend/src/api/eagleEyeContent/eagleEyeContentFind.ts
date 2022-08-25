import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import EagleEyeContentService from '../../services/eagleEyeContentService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentRead)

    const payload = await new EagleEyeContentService(req).findById(req.params.id)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
