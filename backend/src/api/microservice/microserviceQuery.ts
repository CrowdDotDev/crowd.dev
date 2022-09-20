import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MicroserviceService from '../../services/microserviceService'
import track from '../../segment/track'

// /**
//  * POST /tenant/{tenantId}/microservice
//  * @summary Create or update an microservice
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an microservice. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {MicroserviceUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Microservice} 200.application/json
//  * @responseExample {MicroserviceUpsert} 200.application/json.Microservice
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.microserviceRead)

    const payload = await new MicroserviceService(req).query(req.body.data)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Microservices Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
