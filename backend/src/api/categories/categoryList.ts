import { CategoryService } from '@/services/categoryService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * Get /category
 * @summary List Category
 * @tag Category
 * @security Bearer
 * @description Query category with filters
 * @bodyContent {CategoryQuery} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.categoryRead)

  const service = new CategoryService(req)
  const payload = await service.listCategories(req.query)
  await req.responseHandler.success(req, res, payload)
}
