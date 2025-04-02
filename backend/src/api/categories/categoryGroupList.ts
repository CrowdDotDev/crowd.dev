import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import {CategoryService} from "@/services/categoryService";

/**
 * Get /category-group
 * @summary List Category groups
 * @tag CategoryGroups
 * @security Bearer
 * @description Query category groups with filters and pagination
 * @bodyContent {CategoryGroupsQuery} application/json
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.categoryRead)

  const service = new CategoryService(req)
  const payload = await service.listCategoryGroups(req.query)

  await req.responseHandler.success(req, res, payload)
}

