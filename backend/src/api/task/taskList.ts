import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskRead)

  const payload = await new TaskService(req).findAndCountAll(req.query)

  await req.responseHandler.success(req, res, payload)
}
