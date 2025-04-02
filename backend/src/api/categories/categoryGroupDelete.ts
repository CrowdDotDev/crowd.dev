import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import {CategoryService} from "@/services/categoryService";

/**
 * DELETE /category-groups/{id}
 * @summary Delete a category group
 * @tag Category Groups
 * @security Bearer
 * @description Delete a category group by ID
 * @pathParam {string} id - The ID of the category group
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.categoryEdit)

  const service = new CategoryService(req)
  await service.deleteCategoryGroup(req.params.id)

  await req.responseHandler.success(req, res, true)
}
