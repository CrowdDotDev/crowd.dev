import Permissions from '../../security/permissions'
import track from '../../segment/track'
import TaskService from '../../services/taskService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /tenant/{tenantId}/task/query
 * @summary Query tasks
 * @tag Tasks
 * @security Bearer
 * @description Query tasks. It accepts filters, sorting options and pagination.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {TaskQuery} application/json
 * @response 200 - Ok
 * @responseContent {TaskList} 200.application/json
 * @responseExample {TaskList} 200.application/json.Task
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskRead)

  const payload = await new TaskService(req).query(req.body)

  if (req.query.filter && Object.keys(req.query.filter).length > 0) {
    track('Tasks Advanced Filter', { ...payload }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
