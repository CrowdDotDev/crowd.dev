import Permissions from '../../../security/permissions'
import { CollectionService } from '@/services/collectionService'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * POST /collections/insights-projects
 * @summary Create an insights project
 * @tag Collections
 * @security Bearer
 * @description Create a new insights project
 * @bodyContent {InsightsProjectCreateInput} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionEdit)

  const service = new CollectionService(req)
  const payload = await service.createInsightsProject(req.body)

  await req.responseHandler.success(req, res, payload)
}
