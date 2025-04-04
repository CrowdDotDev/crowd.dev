import { CategoryService } from '@/services/categoryService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * DELETE /category/{id}
 * @summary Delete a category
 * @tag Categories
 * @security Bearer
 * @description Delete a category by ID
 * @pathParam {string} id - The ID of the category
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.categoryEdit)

  const service = new CategoryService(req)
  await service.deleteCategory(req.params.id)

  await req.responseHandler.success(req, res, true)
}
