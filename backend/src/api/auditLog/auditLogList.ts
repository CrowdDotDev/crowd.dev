import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import AuditLogRepository from '../../database/repositories/auditLogRepository'
import Permissions from '../../security/permissions'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.auditLogRead)

    const payload = await AuditLogRepository.findAndCountAll(req.query, req)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
