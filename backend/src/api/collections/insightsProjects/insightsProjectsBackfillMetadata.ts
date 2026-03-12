import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * POST /collections/insights-projects/:id/backfill-metadata
 * @summary Backfill metadata for an insights project
 * @tag Collections
 * @security Bearer
 * @description Triggers updateInsightsProject to populate metadata (description, keywords,
 * github, logoUrl, twitter, website, widgets) and optionally fire automaticCategorization.
 * @bodyContent {BackfillMetadataInput} application/json
 * @bodyRequired
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

  const { platform, segmentId, isFirstUpdate = false } = req.body
  const insightsProjectId = req.params.id

  const transaction = await req.database.sequelize.transaction()

  try {
    await new IntegrationService(req).updateInsightsProject({
      insightsProjectId,
      platform,
      segmentId,
      isFirstUpdate,
      transaction,
    })

    await transaction.commit()

    await req.responseHandler.success(req, res, { insightsProjectId })
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}
