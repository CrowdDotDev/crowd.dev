import Permissions from '../../security/permissions'
import SegmentService from '../../services/segmentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.segmentEdit)

  const payload = await new SegmentService(req).update(req.params.segmentId, req.body)

  await req.responseHandler.success(req, res, payload)
}
