import Permissions from '../../security/permissions'
import MicroserviceService from '../../services/microserviceService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  const permissionsChecker = new PermissionChecker(req)
  permissionsChecker.validateHas(Permissions.values.microserviceCreate)
  permissionsChecker.validateMicroservicesProtectedFields(req.body)

  const payload = await new MicroserviceService(req).create(req.body)

  await req.responseHandler.success(req, res, payload)
}
