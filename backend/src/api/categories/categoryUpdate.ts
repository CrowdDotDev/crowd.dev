import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import {CategoryService} from "@/services/categoryService"

/**
 * PATCH /category/:id
 * @summary Update a category
 * @tag Categories
 * @security Bearer
 * @description Update a category
 * @bodyContent {CategoryUpdateInput} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.categoryEdit)

  const service = new CategoryService(req)
  const payload = await service.updateCategory(req.params.id, req.body)

  await req.responseHandler.success(req, res, payload)
}
