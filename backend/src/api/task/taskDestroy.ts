import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

// /**
//  * DELETE /tenant/{tenantId}/task/{id}
//  * @summary Delete a task
//  * @task Tasks
//  * @security Bearer
//  * @description Delete a task.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @pathParam {string} id - The ID of the task
//  * @response 200 - Ok
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskDestroy)

  await new TaskService(req).destroyAll(req.query.ids)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
