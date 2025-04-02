import { CategoryService } from '@/services/categoryService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /category
 * @summary Create a category
 * @tag Category
 * @security Bearer
 * @description Create a new category
 * @bodyContent {CollectionCreateInput} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.categoryEdit)

  const service = new CategoryService(req)
  const payload = await service.createCategory(req.body)

  await req.responseHandler.success(req, res, payload)
}
