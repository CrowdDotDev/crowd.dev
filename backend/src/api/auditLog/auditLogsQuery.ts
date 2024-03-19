import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import AuditLogsService from '@/services/auditLogsService'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.auditLogRead)

  const auditLogsService = new AuditLogsService(req)
  const payload = await auditLogsService.query(req.body)

  await req.responseHandler.success(req, res, payload)
}
