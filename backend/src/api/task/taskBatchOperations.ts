import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'
import Error400 from '../../errors/Error400'

// /**
//  * POST /tenant/{tenantId}/task/batch
//  * @summary Make batch operations on tasks
//  * @tag Tasks
//  * @security Bearer
//  * @description Make batch operations on tasks
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {TaskInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Task} 200.application/json
//  * @responseExample {Task} 200.application/json.Task
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.taskBatch)

    let payload
    switch (req.body.operation) {
      case 'findAndUpdateAll':
        payload = await new TaskService(req).findAndUpdateAll(req.body.payload)
        break
      default:
        throw new Error400('en', 'tasks.errors.unknownOperation')
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
