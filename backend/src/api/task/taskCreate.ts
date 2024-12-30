import Permissions from '../../security/permissions'
import track from '../../segment/track'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /tenant/{tenantId}/task
 * @summary Create a task
 * @tag Tasks
 * @security Bearer
 * @description Create a task
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {TaskInput} application/json
 * @response 200 - Ok
 * @responseContent {Task} 200.application/json
 * @responseExample {Task} 200.application/json.Task
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskCreate)

  const payload = await new TaskService(req).create(req.body)

  track(
    'Task Created',
    { id: payload.id, dueDate: payload.dueDate, members: payload.members },
    { ...req },
  )

  await req.responseHandler.success(req, res, payload)
}
