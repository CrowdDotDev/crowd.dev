import Error403 from '../../errors/Error403'
import { i18n } from '../../i18n'
import track from '../../segment/track'
import SampleDataService from '../../services/sampleDataService'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  new PermissionChecker(req).validateHas(Permissions.values.memberDestroy)

  await new SampleDataService(req).deleteSampleData()

  track('Delete sample data', {}, { ...req })

  req.responseHandler.success(req, res, {
    message: i18n(req.language, 'tenant.sampleDataDeletionCompleted'),
  })
}
