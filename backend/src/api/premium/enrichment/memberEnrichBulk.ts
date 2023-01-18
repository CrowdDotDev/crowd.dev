import Permissions from '../../../security/permissions'
import { sendBulkEnrichMessage } from '../../../serverless/utils/nodeWorkerSQS'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)
  const membersToEnrich = req.body.members
  const tenant = req.currentTenant.id

  await sendBulkEnrichMessage(tenant, membersToEnrich)
  await req.responseHandler.success(req, res, membersToEnrich)
}
