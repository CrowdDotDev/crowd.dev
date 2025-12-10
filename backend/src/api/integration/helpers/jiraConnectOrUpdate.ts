import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tenantEdit)
  const integrationService = new IntegrationService(req)
  const payload = req.body.id
    ? await integrationService.updateJiraIntegration(req.body)
    : await integrationService.connectJiraIntegration(req.body)
  await req.responseHandler.success(req, res, payload)
}
