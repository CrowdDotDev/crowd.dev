import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import { Error400, Error409, canonicalizeGithubRepoUrl } from '@crowd/common'
import {
  deriveProjectIdentityFromRepoUrl,
  upsertProjectCatalogManualAction,
} from '@crowd/data-access-layer'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'
import { projectCatalogUpsertRequestSchema } from '../public/v1/projectCatalog/types'

/**
 * POST /project-catalog
 * @summary Manually upsert a projectCatalog row for any pipeline phase
 * @tag Project Catalog
 * @security Bearer
 * @description Upserts a projectCatalog row with source 'manual' and the
 * given action, so it gets picked up by the corresponding pipeline stage
 * (discovery, evaluation, or onboarding) on its next run.
 * @bodyContent {string} repoUrl - GitHub repo URL (e.g. https://github.com/owner/repo)
 * @bodyContent {string} action - One of: auto, evaluate, onboard
 * @bodyContent {string} projectName - Optional project name used to match the LF project
 * @bodyContent {string} requestText - Optional free-text onboarding request (max 10000 chars)
 * @response 200 - Ok
 * @response 400 - Bad request
 * @response 401 - Unauthorized
 * @response 409 - Already onboarded or onboarding in progress
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.projectCatalogEdit)

  const parsed = projectCatalogUpsertRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return req.responseHandler.error(req, res, new Error400(req.language))
  }

  const repoUrl = canonicalizeGithubRepoUrl(parsed.data.repoUrl)
  if (!repoUrl) {
    return req.responseHandler.error(req, res, new Error400(req.language))
  }

  const identity = deriveProjectIdentityFromRepoUrl(repoUrl)
  if (!identity) {
    return req.responseHandler.error(req, res, new Error400(req.language))
  }

  const qx = SequelizeRepository.getQueryExecutor(req)

  const payload = await upsertProjectCatalogManualAction(qx, {
    ...identity,
    repoUrl,
    action: parsed.data.action,
    projectName: parsed.data.projectName,
    requestText: parsed.data.requestText,
  })

  if (!payload) {
    return req.responseHandler.error(
      req,
      res,
      new Error409(req.language, 'errors.alreadyOnboarded', repoUrl),
    )
  }

  return req.responseHandler.success(req, res, payload)
}
