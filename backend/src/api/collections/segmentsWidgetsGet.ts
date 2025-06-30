import { CollectionService } from '@/services/collectionService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /segments/:id/widgets
 * @summary Get needed widgets for a segmentId
 * @tag Collections
 * @security Bearer
 * @description Get an insights project by ID
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionEdit)

  const service = new CollectionService(req)
  const payload = await service.findSegmentsWidgetsById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
