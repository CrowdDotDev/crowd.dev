import Permissions from '../../security/permissions'
import MicroserviceService from '../../services/microserviceService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.microserviceAutocomplete)

  const payload = await new MicroserviceService(req).findAllAutocomplete(
    req.query.query,
    req.query.limit,
  )

  await req.responseHandler.success(req, res, payload)
}
