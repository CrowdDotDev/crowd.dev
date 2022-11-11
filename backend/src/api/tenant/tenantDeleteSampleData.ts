import Error403 from '../../errors/Error403'
import { i18n } from '../../i18n'
import track from '../../segment/track'
import SampleDataService from '../../services/sampleDataService'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  await new SampleDataService(req).deleteSampleData()

  track('Delete sample data', {}, { ...req })

  req.responseHandler.success(req, res, {
    message: i18n(req.language, 'tenant.sampleDataDeletionCompleted'),
  })
}
