import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

// /**
//  * PUT /tenant/{tenantId}/task/{id}/status/{status}
//  * @summary Update an task's status
//  * @tag Tasks
//  * @security Bearer
//  * @description Update a task's status
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @pathParam {string} id - The ID of the task
//  * @pathParam {string} status - The status of the task (send "null" for null)
//  * @response 200 - Ok
//  * @responseContent {Task} 200.application/json
//  * @responseExample {Task} 200.application/json.Task
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskEdit)

  if (req.params.status === 'null') {
    req.params.status = null
  }

  const payload = await new TaskService(req).updateStatus(req.params.id, req.params.status)

  await req.responseHandler.success(req, res, payload)
}
