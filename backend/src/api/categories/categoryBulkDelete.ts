import { CategoryService } from '@/services/categoryService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /category/
 * @summary Delete multiple categories
 * @tag Categories
 * @security Bearer
 * @description Delete multiple categories by ID
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.categoryEdit)

  const service = new CategoryService(req)
  await service.deleteCategories(req.body.ids)

  await req.responseHandler.success(req, res, true)
}
