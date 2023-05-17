import Permissions from '../../security/permissions'
import SegmentService from '../../services/segmentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.segmentRead)

  const segmentService = new SegmentService(req)
  const payload = await segmentService.findById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
