import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

  const code = req.query.code

  const integration = await new IntegrationService(req).gitlabConnect(code)

  await req.responseHandler.success(req, res, integration)
}
