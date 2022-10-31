import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import EagleEyeContentService from '../../services/eagleEyeContentService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.eagleEyeContentEdit)

    const payload = await new EagleEyeContentService(req).update(req.params.id, req.body)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
