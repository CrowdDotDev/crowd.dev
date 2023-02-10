import Error403 from '../../errors/Error403'
import { i18n } from '../../i18n'
import SampleDataService from '../../services/sampleDataService'
import track from '../../segment/track'
import Permissions from '../../security/permissions'
import PermissionChecker from '../../services/user/permissionChecker'

const fs = require('fs')
const path = require('path')

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  new PermissionChecker(req).validateHas(Permissions.values.memberCreate)

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
