import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tenantEdit)
  const payload = await new IntegrationService(req).connectGithub(
    req.params.code,
    req.body.installId,
    req.body.setupAction,
  )
  await req.responseHandler.success(req, res, payload)
}
