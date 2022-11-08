import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

// /**
//  * PUT /tenant/{tenantId}/task/{id}
//  * @summary Update an task
//  * @tag Tasks
//  * @security Bearer
//  * @description Update a task
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @pathParam {string} id - The ID of the task
//  * @bodyContent {TaskInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Task} 200.application/json
//  * @responseExample {Task} 200.application/json.Task
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskEdit)

  const payload = await new TaskService(req).update(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
