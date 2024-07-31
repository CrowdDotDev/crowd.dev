import MergeActionsService from '@/services/MergeActionsService'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.noteRead)

  const payload = await new MergeActionsService(req).query(req.body)

  await req.responseHandler.success(req, res, payload)
}
