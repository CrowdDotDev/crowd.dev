import AuditLogRepository from '../../database/repositories/auditLogRepository'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.auditLogRead)

  const payload = await AuditLogRepository.findAndCountAll(req.query, req)

  await req.responseHandler.success(req, res, payload)
}
