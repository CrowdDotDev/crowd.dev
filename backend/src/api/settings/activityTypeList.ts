import SegmentService from '../../services/segmentService'

/**
 * GET /tenant/{tenantId}/settings/activity/types
 * @summary List all activity types
 * @tag Activities
 * @security Bearer
 * @description List all activity types
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @response 200 - Ok
 * @responseContent {ActivityTypes} 200.application/json
 * @responseExample {ActivityTypes} 200.application/json.ActivityTypes
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  const payload = SegmentService.listActivityTypes(req)

  await req.responseHandler.success(req, res, payload)
}
