import Permissions from '../../security/permissions'
import track from '../../segment/track'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /tenant/{tenantId}/task/{id}
 * @summary Update an task
 * @tag Tasks
 * @security Bearer
 * @description Update a task
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the task
 * @bodyContent {TaskInput} application/json
 * @response 200 - Ok
 * @responseContent {Task} 200.application/json
 * @responseExample {Task} 200.application/json.Task
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskEdit)

  const taskBeforeUpdate = await new TaskService(req).findById(req.params.id)
  const payload = await new TaskService(req).update(req.params.id, req.body)

  if (taskBeforeUpdate.type === 'suggested') {
    track(
      'Task Created (from suggestion)',
      { id: payload.id, dueDate: payload.dueDate, members: payload.members },
      { ...req },
    )
  }
  if (taskBeforeUpdate.status === 'in-progress' && payload.status === 'done') {
    track(
      'Task Completed',
      {
        id: payload.id,
        dueDate: payload.dueDate,
        members: payload.members,
        status: payload.status,
      },
      { ...req },
    )
  } else {
    track(
      'Task Updated',
      {
        id: payload.id,
        dueDate: payload.dueDate,
        members: payload.members,
        status: payload.status,
      },
      { ...req },
    )
  }

  await req.responseHandler.success(req, res, payload)
}
