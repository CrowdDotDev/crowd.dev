import { GITHUB_CONFIG } from '@/conf'

import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

const isSnowflakeEnabled = GITHUB_CONFIG.isSnowflakeEnabled === 'true'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tenantEdit)
  let payload
  if (isSnowflakeEnabled) {
    payload = await new IntegrationService(req).mapGithubReposSnowflake(
      req.params.id,
      req.body.mapping,
      true,
      req.body?.isUpdateTransaction ?? false,
    )
  } else {
    payload = await new IntegrationService(req).mapGithubRepos(
      req.params.id,
      req.body.mapping,
      true,
    )
  }
  await req.responseHandler.success(req, res, payload)
}
