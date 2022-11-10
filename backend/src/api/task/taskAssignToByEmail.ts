import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

// /**
//  * PUT /tenant/{tenantId}/task/{id}/assignTo/email/{userEmail}
//  * @summary Update assignee by email
//  * @tag Tasks
//  * @security Bearer
//  * @description Update a task's assignee by email
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @pathParam {string} id - The ID of the task
//  * @pathParam {string} userEmail - The email of the workspace member to assign the task to
//  * @response 200 - Ok
//  * @responseContent {Task} 200.application/json
//  * @responseExample {Task} 200.application/json.Task
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskEdit)

  if (req.params.userEmail === 'null') {
    req.params.userEmail = null
  }

  const payload = await new TaskService(req).assignToByEmail(req.params.id, req.params.userEmail)

  await req.responseHandler.success(req, res, payload)
}
