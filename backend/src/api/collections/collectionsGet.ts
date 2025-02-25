import { CollectionService } from '@/services/collectionService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /collections/{id}
 * @summary Get a collection
 * @tag Collections
 * @security Bearer
 * @description Get a collection by ID
 * @pathParam {string} id - The ID of the collection
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionRead)

  const service = new CollectionService(req)
  const payload = await service.findById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
