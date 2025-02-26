import { CollectionService } from '@/services/collectionService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /segments/{id}/repositories
 * @summary Get repositories for a segment
 * @tag Segments
 * @security Bearer
 * @description Get repositories for a segment
 * @pathParam {string} id - The ID of the segment
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionRead)

  const service = new CollectionService(req)
  const payload = await service.findRepositoriesForSegment(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
