// import moment from 'moment'
import getUserContext from '../../../../database/utils/getUserContext'
import MemberService from '../../../../services/memberService'
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
  const memberService = new MemberService(userContext)
  const suggestions = await memberService.getMergeSuggestions()
  await memberService.addToMerge(suggestions)
  log.info('suggestions', suggestions)
}

export { mergeSuggestionsWorker }
