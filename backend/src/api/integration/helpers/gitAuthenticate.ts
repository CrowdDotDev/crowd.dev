import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tenantEdit)
  const integrationData = {
    ...req.body,
    remotes: req.body.remotes?.map((remote) => ({ url: remote, forkedFrom: null })) || [],
  }

  const payload = await new IntegrationService(req).gitConnectOrUpdate(integrationData)
  await req.responseHandler.success(req, res, payload)
}
