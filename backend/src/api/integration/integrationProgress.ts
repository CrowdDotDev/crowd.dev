import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import IntegrationService from '../../services/integrationService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationRead)

  const payload = await new IntegrationService(req).getIntegrationProgress(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
