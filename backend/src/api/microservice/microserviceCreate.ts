import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MicroserviceService from '../../services/microserviceService'

export default async (req, res) => {
  try {
    const permissionsChecker = new PermissionChecker(req)
    permissionsChecker.validateHas(Permissions.values.microserviceCreate)
    permissionsChecker.validateMicroservicesProtectedFields(req.body)

    const payload = await new MicroserviceService(req).create(req.body)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
