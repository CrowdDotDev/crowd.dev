import ApiResponseHandler from '../apiResponseHandler'
import Error403 from '../../errors/Error403'
import { i18n } from '../../i18n'
import SampleDataService from '../../services/sampleDataService'

export default async (req, res) => {
  try {
    if (!req.currentUser || !req.currentUser.id) {
      throw new Error403(req.language)
    }

    await new SampleDataService(req).deleteSampleData()

    ApiResponseHandler.success(req, res, {
      message: i18n(req.language, 'tenant.sampleDataDeletionCompleted'),
    })
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
