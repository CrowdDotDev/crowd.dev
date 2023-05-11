import Error403 from '../../errors/Error403'
import Permissions from '../../security/permissions'
import track from '../../segment/track'
import ReportService from '../../services/reportService'
import SegmentService from '../../services/segmentService'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
    new PermissionChecker(req).validateHas(Permissions.values.segmentCreate)

    const payload = await new SegmentService(req).createProjectGroup(req.body)

    await req.responseHandler.success(req, res, payload)
}
