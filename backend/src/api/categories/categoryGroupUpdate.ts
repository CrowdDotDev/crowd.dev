import { CategoryService } from '@/services/categoryService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PATCH /category-group/:id
 * @summary Update a category group
 * @tag Category Groups
 * @security Bearer
 * @description Update a category group
 * @bodyContent {CategoryGroupUpdateInput} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.categoryEdit)

  const service = new CategoryService(req)
  const payload = await service.updateCategoryGroup(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
