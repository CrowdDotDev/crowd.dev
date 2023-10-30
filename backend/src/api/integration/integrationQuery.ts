import Permissions from '../../security/permissions'
import track from '../../segment/track'
import IntegrationService from '../../services/integrationService'
import PermissionChecker from '../../services/user/permissionChecker'

// /**
//  * POST /tenant/{tenantId}/integration
//  * @summary Create or update an integration
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an integration. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {IntegrationUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Integration} 200.application/json
//  * @responseExample {IntegrationUpsert} 200.application/json.Integration
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationRead)

  const payload = await new IntegrationService(req).query(req.body)

  if (req.query.filter && Object.keys(req.query.filter).length > 0) {
    track('Integrations Advanced Filter', { ...payload }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
