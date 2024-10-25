import AuditLogsService from '@/services/auditLogsService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.auditLogRead)

  const auditLogsService = new AuditLogsService(req)
  const payload = await auditLogsService.query(req.body)

  await req.responseHandler.success(req, res, payload)
}
