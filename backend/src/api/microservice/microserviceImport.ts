import Permissions from '../../security/permissions'
import MicroserviceService from '../../services/microserviceService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.microserviceImport)

  await new MicroserviceService(req).import(req.body, req.body.importHash)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
