import MemberAttributesService from '@/services/member/memberAttributesService'

import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

/**
 * PATCH /member/:memberId/attributes
 * @summary Update member attributes
 * @tag Members
 * @security Bearer
 * @description Update member attributes.
 * @pathParam {string} memberId - member ID
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.Attributes
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const memberAttributesService = new MemberAttributesService(req)

  // defaults to true unless query param is 'false'
  const manuallyChanged = req.query.manuallyChanged !== 'false'

  // remove segments from body
  delete req.body.segments

  const payload = await memberAttributesService.update(
    req.params.memberId,
    req.body,
    manuallyChanged,
  )

  await req.responseHandler.success(req, res, payload)
}
