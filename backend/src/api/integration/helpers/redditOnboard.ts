import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.tenantEdit)
  const segmentId = req.body.segments[0]
  const payload = await new IntegrationService(req).redditOnboard(req.body.subreddits, segmentId)
  await req.responseHandler.success(req, res, payload)
}
