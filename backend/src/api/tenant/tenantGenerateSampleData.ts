import ApiResponseHandler from '../apiResponseHandler'
import Error403 from '../../errors/Error403'
import { i18n } from '../../i18n'
import SampleDataService from '../../services/sampleDataService'

const fs = require('fs')
const path = require('path')

export default async (req, res) => {
  try {
    if (!req.currentUser || !req.currentUser.id) {
      throw new Error403(req.language)
    }
    const sampleMembersActivities = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../../database/initializers/sample-data.json'),
        'utf8',
      ),
    )

    ApiResponseHandler.success(req, res, {
      message: i18n(req.language, 'tenant.sampleDataCreationStarted'),
    }).then(async () => new SampleDataService(req).generateSampleData(sampleMembersActivities))
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
