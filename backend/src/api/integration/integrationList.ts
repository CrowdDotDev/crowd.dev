import Permissions from '../../security/permissions'
import IntegrationService from '../../services/integrationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationRead)

  const payload = await new IntegrationService(req).findAndCountAll(req.query)

  await req.responseHandler.success(req, res, payload)
}
