import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskAutocomplete)

  const payload = await new TaskService(req).findAllAutocomplete(req.query.query, req.query.limit)

  await req.responseHandler.success(req, res, payload)
}
