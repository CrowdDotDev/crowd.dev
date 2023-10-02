import OrganizationService from '@/services/organizationService'
import Permissions from '../../security/permissions'
import track from '../../segment/track'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationEdit)
  await new OrganizationService(req).addToNoMerge(
    req.params.organizationId,
    req.body.organizationToNotMerge,
  )

  track('Ignore merge members', {}, { ...req })

  await req.responseHandler.success(req, res, { status: 200 })
}
