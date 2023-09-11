import OrganizationService from '@/services/organizationService'
import Permissions from '../../security/permissions'
import track from '../../segment/track'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.organizationEdit)

  const payload = await new OrganizationService(req).merge(
    req.params.organizationId,
    req.body.organizationToMerge,
  )

  track('Merge organizations', { ...payload }, { ...req })

  const status = payload.status || 200

  await req.responseHandler.success(req, res, payload, status)
}
