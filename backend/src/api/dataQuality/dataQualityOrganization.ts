import { FeatureFlag } from '@crowd/types'

import DataQualityService from '@/services/dataQualityService'

import isFeatureEnabled from '../../feature-flags/isFeatureEnabled'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/data-quality/organization
 * @summary Find a organization data issues
 * @tag Data Quality
 * @security Bearer
 * @description Find a data quality issues for organizations
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @response 200 - Ok
 * @responseContent {DataQualityResponse} 200.application/json
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationRead)

  const segmentId = req.query.segments?.length > 0 ? req.query.segments[0] : null
  if (!segmentId) {
    const segmentsEnabled = await isFeatureEnabled(FeatureFlag.SEGMENTS, req)
    if (segmentsEnabled) {
      await req.responseHandler.error(req, res, {
        code: 400,
        message: 'Segment ID is required',
      })
      return
    }
  }

  const payload = await new DataQualityService(req).findOrganizationIssues()

  await req.responseHandler.success(req, res, payload)
}
