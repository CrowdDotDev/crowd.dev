import Permissions from '@/security/permissions'
import GithubIntegrationService from '@/services/githubIntegrationService'
import PermissionChecker from '@/services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

  const payload = await new GithubIntegrationService(req).findGithubRepos(
    req.query.query,
    req.query.limit,
    req.query.offset,
  )
  await req.responseHandler.success(req, res, payload)
}
