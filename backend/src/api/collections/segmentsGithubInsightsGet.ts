import { CollectionService } from '@/services/collectionService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import { CategoryService } from '@/services/categoryService'

/**
 * GET /segments/{id}/github-insights
 * @summary Get github insights for a segment
 * @tag Segments
 * @security Bearer
 * @description Get github insights for a segment
 * @pathParam {string} id - The ID of the segment
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.collectionRead)

  const service = new CollectionService(req)
  const payload = await service.findGithubInsightsForSegment(req.params.id)

  const categoryService = new CategoryService(req)

  if (payload) {

    const { categories } = await categoryService.findRepoCategoriesWithLLM({
      repo_url: payload.github,
      repo_description: payload.description,
      repo_topics: payload.topics,
      repo_homepage: payload.website,
    })

    console.log(categories)
  }

  await req.responseHandler.success(req, res, payload)
}
