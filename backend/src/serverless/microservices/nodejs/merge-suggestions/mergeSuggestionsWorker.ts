// import moment from 'moment'
import getUserContext from '../../../../database/utils/getUserContext'
// import IntegrationService from '../../../../services/integrationService'
// import ActivityService from '../../../../services/activityService'
// import {
//   integrationDataCheckerSettings,
//   IntegrationDataCheckerSettingsType,
// } from './integrationDataCheckerSettings'
import { IRepositoryOptions } from '../../../../database/repositories/IRepositoryOptions'
import { createServiceChildLogger } from '../../../../utils/logging'
// import { IntegrationDataCheckerSettings } from './integrationDataCheckerTypes'
// import { sendSlackAlert, SlackAlertTypes } from '../../../../utils/slackAlerts'

const log = createServiceChildLogger('mergeSuggestionsWorker')

async function mergeSuggestionsWorker(tenantId): Promise<void> {
  const userContext: IRepositoryOptions = await getUserContext(tenantId)
  log.info('mergeSuggestionsWorker', tenantId, userContext)
}

export { mergeSuggestionsWorker }
