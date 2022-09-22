import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import IntegrationService from '../../services/integrationService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.integrationImport)

    await new IntegrationService(req).import(req.body, req.body.importHash)

    const payload = true

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
