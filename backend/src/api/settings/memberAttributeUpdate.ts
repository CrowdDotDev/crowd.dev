import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberAttributeSettingsService from '../../services/memberAttributeSettingsService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberAttributesEdit)

    const payload = await new MemberAttributeSettingsService(req).update(
      req.params.id,
      req.body.data,
    )

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
