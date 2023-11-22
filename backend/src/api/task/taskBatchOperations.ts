import { Error400 } from '@crowd/common'
import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'

/**
 * POST /tenant/{tenantId}/task/batch
 * @summary Make batch operations on tasks
 * @tag Tasks
 * @security Bearer
 * @description Make batch operations on tasks
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {TaskBatchInput} application/json
 * @response 200 - Ok
 * @responseContent {TaskFindAndUpdateAll} 200.application/json
 * @responseExample {TaskFindAndUpdateAll} 200.application/json.Task
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.taskBatch)

  let payload
  switch (req.body.operation) {
    case 'findAndUpdateAll':
      payload = await new TaskService(req).findAndUpdateAll(req.body.payload)
      break
    case 'findAndDeleteAll':
      payload = await new TaskService(req).findAndDeleteAll(req.body.payload)
      break
    default:
      throw new Error400('en', 'tasks.errors.unknownBatchOperation', req.body.operation)
  }

  await req.responseHandler.success(req, res, payload)
}
