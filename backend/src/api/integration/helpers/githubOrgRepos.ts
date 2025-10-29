import GithubIntegrationService from '@crowd/common_services/src/services/github.integration.service'

import Permissions from '@/security/permissions'
import PermissionChecker from '@/services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

  const payload = await GithubIntegrationService.getOrgRepos(req.params.org)
  await req.responseHandler.success(req, res, payload)
}
