import MergeActionsService from '@/services/MergeActionsService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /mergeAction
 * @summary Query mergeActions
 * @tag MergeActions
 * @security Bearer
 * @description Query mergeActions. It accepts filters and pagination.
 * @queryParam {string} entityId - ID of the entity
 * @queryParam {string} type - type of the entity (e.g., org or member)
 * @queryParam {number} [limit] - number of records to return (optional, default to 20)
 * @queryParam {number} [offset] - number of records to skip (optional, default to 0)
 * @response 200 - Ok
 * @responseContent {MergeActionList} 200.application/json
 * @responseExample {MergeActionList} 200.application/json.MergeAction
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.mergeActionRead)

  const payload = await new MergeActionsService(req).query(req.query)

  await req.responseHandler.success(req, res, payload)
}
