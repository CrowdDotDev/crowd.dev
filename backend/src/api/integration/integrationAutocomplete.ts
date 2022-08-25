import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import IntegrationService from '../../services/integrationService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.integrationAutocomplete)

    const payload = await new IntegrationService(req).findAllAutocomplete(
      req.query.query,
      req.query.limit,
    )

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
