import Error403 from '../../errors/Error403'
import { i18n } from '../../i18n'
import SampleDataService from '../../services/sampleDataService'
import track from '../../segment/track'

const fs = require('fs')
const path = require('path')

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }
  const sampleMembersActivities = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../database/initializers/sample-data.json'),
      'utf8',
    ),
  )

  track('Generate sample data', {}, { ...req })

  await req.responseHandler.success(req, res, {
    message: i18n(req.language, 'tenant.sampleDataCreationStarted'),
  })

  await new SampleDataService(req).generateSampleData(sampleMembersActivities)
}
