import Permissions from '../../security/permissions'
import MicroserviceService from '../../services/microserviceService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.microserviceRead)

  const payload = await new MicroserviceService(req).findById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
