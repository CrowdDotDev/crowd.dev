import { CollectionService } from '@/services/collectionService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /collection/:id
 * @summary Update a collection
 * @tag Collections
 * @security Bearer
 * @description Update a collection
 * @bodyContent {CollectionUpdateInput} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionEdit)

  const service = new CollectionService(req)
  const payload = await service.updateCollection(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
