import Permissions from '../../security/permissions'
import IntegrationService from '../../services/integrationService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationCreate)

  new PermissionChecker(req).validateIntegrationsProtectedFields(req.body)

  const payload = await new IntegrationService(req).create(req.body)

  await req.responseHandler.success(req, res, payload)
}
