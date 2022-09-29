import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'

/**
 * PUT /tenant/{tenantId}/task/{id}/assignTo/{userId}
 * @summary Update assignee
 * @tag Tasks
 * @security Bearer
 * @description Update a task's assignee
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the task
 * @pathParam {string} userId - The ID of the user to assign the task to
 * @response 200 - Ok
 * @responseContent {Task} 200.application/json
 * @responseExample {Task} 200.application/json.Task
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.taskEdit)

    if (req.params.userId === 'null') {
      req.params.userId = null
    }

    const payload = await new TaskService(req).assignTo(req.params.id, req.params.userId)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
