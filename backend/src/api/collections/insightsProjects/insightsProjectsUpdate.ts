import { CollectionService } from '@/services/collectionService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * POST /collections/insights-projects/{id}
 * @summary Update an insights project
 * @tag Collections
 * @security Bearer
 * @description Update an insights project
 * @bodyContent {InsightsProjectUpdateInput} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionEdit)

  const service = new CollectionService(req)
  const payload = await service.updateInsightsProject(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
