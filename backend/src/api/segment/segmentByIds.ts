import Permissions from '../../security/permissions'
import SegmentService from '../../services/segmentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.segmentRead)

  const segmentService = new SegmentService(req)
  const payload = await segmentService.findByIds(req.body.ids)

  await req.responseHandler.success(req, res, payload)
}
