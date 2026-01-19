import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * GET /integration/:id/repositories
 * Unified endpoint to get repository mappings for any code platform integration
 * (github, gitlab, git, gerrit)
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tenantEdit)
  const payload = await new IntegrationService(req).getIntegrationRepositories(req.params.id)
  await req.responseHandler.success(req, res, payload)
}
