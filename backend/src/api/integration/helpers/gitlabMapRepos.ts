import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tenantEdit)
  const payload = await new IntegrationService(req).mapGitlabRepos(
    req.params.id,
    req.body.mapping,
    req.body.projectIds,
  )
  await req.responseHandler.success(req, res, payload)
}
