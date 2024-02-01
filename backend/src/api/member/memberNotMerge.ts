import Permissions from '../../security/permissions'
import track from '../../segment/track'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberAttributesEdit)
  const payload = await new MemberService(req).addToNoMerge(
    req.params.memberId,
    req.body.memberToNotMerge,
  )

  track(
    'Ignore merge members',
    { memberId: req.params.memberId, memberToNotMergeId: req.body.memberToNotMerge },
    { ...req },
  )

  await req.responseHandler.success(req, res, payload)
}
