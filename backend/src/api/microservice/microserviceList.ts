import Permissions from '../../security/permissions'
import MicroserviceService from '../../services/microserviceService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.microserviceRead)

  const payload = await new MicroserviceService(req).findAndCountAll(req.query)

  await req.responseHandler.success(req, res, payload)
}
