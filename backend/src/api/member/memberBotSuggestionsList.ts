import MemberService from '@/services/memberService'

import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /member/bot-suggestions
 * @summary List member bot suggestions
 * @tag Members
 * @security Bearer
 * @description List member bot suggestions
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  const payload = await new MemberService(req).findMembersWithBotSuggestions(req.query)

  await req.responseHandler.success(req, res, payload)
}
