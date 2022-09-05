import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'

// /**
//  * PUT /tenant/{tenantId}/task/{id}
//  * @summary Update an task
//  * @task Tasks
//  * @security Bearer
//  * @description Update a task given an ID.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @pathParam {string} id - The ID of the task
//  * @bodyContent {TaskNoId} application/json
//  * @response 200 - Ok
//  * @responseContent {Task} 200.application/json
//  * @responseExample {Task} 200.application/json.Task
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.taskEdit)

    const payload = await new TaskService(req).update(req.params.id, req.body.data)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
