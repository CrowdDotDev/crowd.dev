import { IMemberIdentity, MemberIdentityType } from '@crowd/types'
import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const body = req.body

  const identity: IMemberIdentity = {
    sourceId: body.sourceId,
    platform: body.platform,
    value: body.value ? body.value : body.username,
    type: body.type ? body.type : MemberIdentityType.USERNAME,
    tenantId: body.tenantId,
    integrationId: body.integrationId,
    memberId: body.memberId,
    createdAt: body.createdAt,
    updatedAt: body.updatedAt,
  }

  const payload = await new MemberService(req).unmergePreview(req.params.memberId, identity)

  await req.responseHandler.success(req, res, payload, 200)
}
