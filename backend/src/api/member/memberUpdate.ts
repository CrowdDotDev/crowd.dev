import lodash from 'lodash'

import Permissions from '../../security/permissions'
import track from '../../segment/track'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * PUT /member/{id}
 * @summary Update a member
 * @tag Members
 * @security Bearer
 * @description Update a member
 * @pathParam {string} id - The ID of the member
 * @bodyContent {MemberUpdateInput} application/json
 * @response 200 - Ok
 * @responseContent {Member} 200.application/json
 * @responseExample {MemberUpsert} 200.application/json.Member
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const member = await new MemberService(req).findById(req.params.id)
  const payload = await new MemberService(req).update(req.params.id, req.body, {
    syncToOpensearch: true,
    manualChange: true,
  })

  const differentTagIds = lodash.difference(
    payload.tags.map((t) => t.id),
    member.tags.map((t) => t.id),
  )
  if (differentTagIds.length > 0) {
    track('Member Tagged', { id: payload.id, tagIds: [...differentTagIds] }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
