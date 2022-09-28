import lodash from 'lodash'
import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import track from '../../segment/track'

/**
 * PUT /tenant/{tenantId}/member/{id}
 * @summary Update a member
 * @tag Members
 * @security Bearer
 * @description Update a member
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the member
 * @bodyContent {MemberUpsertInput} application/json
 * @response 200 - Ok
 * @responseContent {Member} 200.application/json
 * @responseExample {Member} 200.application/json.Member
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

    const member = await new MemberService(req).findById(req.params.id)
    const payload = await new MemberService(req).update(req.params.id, req.body)

    const differentTagIds = lodash.difference(
      payload.tags.map((t) => t.id),
      member.tags.map((t) => t.id),
    )
    if (differentTagIds.length > 0) {
      track('Member Tagged', { id: payload.id, tagIds: [...differentTagIds] }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
