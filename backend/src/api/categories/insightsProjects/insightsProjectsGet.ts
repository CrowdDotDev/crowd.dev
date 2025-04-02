import { CollectionService } from '@/services/collectionService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * GET /collections/insights-projects/:id
 * @summary Get an insights project
 * @tag Collections
 * @security Bearer
 * @description Get an insights project by ID
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionEdit)

  const service = new CollectionService(req)
  const payload = await service.findInsightsProjectById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
