import { FeatureFlag } from '@crowd/types'
import isFeatureEnabled from '@/feature-flags/isFeatureEnabled'
import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/organization/{id}
 * @summary Find an organization
 * @tag Organizations
 * @security Bearer
 * @description Find an organization by ID.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the organization
 * @response 200 - Ok
 * @responseContent {OrganizationResponse} 200.application/json
 * @responseExample {Organization} 200.application/json.Organization
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationRead)

  const segmentId = req.query.segmentId
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

  const payload = await new OrganizationService(req).findByIdOpensearch(req.params.id, segmentId)

  await req.responseHandler.success(req, res, payload)
}
