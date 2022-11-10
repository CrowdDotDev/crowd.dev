import Permissions from '../../security/permissions'
import MicroserviceService from '../../services/microserviceService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  const permissionsChecker = new PermissionChecker(req)
  permissionsChecker.validateHas(Permissions.values.microserviceEdit)
  permissionsChecker.validateMicroservicesProtectedFields(req.body)

  const payload = await new MicroserviceService(req).update(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
