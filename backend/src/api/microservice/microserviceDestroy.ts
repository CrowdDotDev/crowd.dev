import Permissions from '../../security/permissions'
import MicroserviceService from '../../services/microserviceService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.microserviceDestroy)

  await new MicroserviceService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
