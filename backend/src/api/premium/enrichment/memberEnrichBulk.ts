import Permissions from '../../../security/permissions'
import MemberEnrichmentService from '../../../services/premium/enrichment/memberEnrichmentService'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberEdit)

  const membersToEnrich = req.body

  const memberService = new MemberEnrichmentService(req)

  await req.responseHandler.success(req, res, membersToEnrich)
}
