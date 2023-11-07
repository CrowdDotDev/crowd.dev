import Permissions from '../../security/permissions'
import track from '../../segment/track'
import MicroserviceService from '../../services/microserviceService'
import PermissionChecker from '../../services/user/permissionChecker'

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
  new PermissionChecker(req).validateHas(Permissions.values.microserviceRead)

  const payload = await new MicroserviceService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('Microservices Advanced Filter', { ...payload }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
