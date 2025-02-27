import { CollectionService } from '@/services/collectionService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /collections/query
 * @summary Query collections
 * @tag Collections
 * @security Bearer
 * @description Query collections with filters and pagination
 * @bodyContent {CollectionsQuery} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionRead)

  const service = new CollectionService(req)
  const payload = await service.query(req.body)

  await req.responseHandler.success(req, res, payload)
}
