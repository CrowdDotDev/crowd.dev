import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import IntegrationService from '../../services/integrationService'
import track from '../../segment/track'

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
  try {
    new PermissionChecker(req).validateHas(Permissions.values.integrationRead)

    const payload = await new IntegrationService(req).query(req.body.data)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Integrations Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
