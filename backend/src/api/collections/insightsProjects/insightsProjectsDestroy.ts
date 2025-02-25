import { CollectionService } from '@/services/collectionService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * DELETE /collections/insights-projects/{id}
 * @summary Delete an insights project
 * @tag Collections
 * @security Bearer
 * @description Delete an insights project by ID
 * @pathParam {string} id - The ID of the insights project
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionEdit)

  const service = new CollectionService(req)
  await service.destroyInsightsProject(req.params.id)

  await req.responseHandler.success(req, res, true)
}
