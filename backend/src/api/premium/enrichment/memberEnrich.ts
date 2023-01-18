import Permissions from '../../../security/permissions'
import MemberEnrichmentService from '../../../services/premium/enrichment/memberEnrichmentService'
import PermissionChecker from '../../../services/user/permissionChecker'

// /**
//  * PUT /tenant/{tenantId}/member/{id}
//  * @summary Update a member
//  * @tag Members
//  * @security Bearer
//  * @description Update a member
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @pathParam {string} id - The ID of the member
//  * @bodyContent {MemberUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Member} 200.application/json
//  * @responseExample {MemberUpsert} 200.application/json.Member
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)
  const payload = await new MemberEnrichmentService(req).enrichOne(req.params.id)
  await req.responseHandler.success(req, res, payload)
}
