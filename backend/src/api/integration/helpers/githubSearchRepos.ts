import Permissions from '@/security/permissions'
import GithubIntegrationService from '@/services/githubIntegrationService'
import PermissionChecker from '@/services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

  const payload = await GithubIntegrationService.findGithubRepos(req.query.query)
  await req.responseHandler.success(req, res, payload)
}
