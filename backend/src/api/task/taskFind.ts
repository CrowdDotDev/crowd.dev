import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/task/{id}
 * @summary Find a task
 * @tag Tasks
 * @security Bearer
 * @description Find a task by ID
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the task
 * @response 200 - Ok
 * @responseContent {TaskResponse} 200.application/json
 * @responseExample {Task} 200.application/json.Task
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskRead)

  const payload = await new TaskService(req).findById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
