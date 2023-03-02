import moment from 'moment'
import getUserContext from '../../../../database/utils/getUserContext'
import IntegrationService from '../../../../services/integrationService'
import ActivityService from '../../../../services/activityService'
import {
  integrationDataCheckerSettings,
  IntegrationDataCheckerSettingsType,
} from './integrationDataCheckerSettings'
import { IRepositoryOptions } from '../../../../database/repositories/IRepositoryOptions'
import { createServiceChildLogger } from '../../../../utils/logging'
import { IntegrationDataCheckerSettings } from './integrationDataCheckerTypes'
import { sendSlackAlert, SlackAlertTypes } from '../../../../utils/slackAlerts'

const log = createServiceChildLogger('integrationDataCheckerWorker')

async function integrationDataCheckerWorker(integrationId, tenantId): Promise<void> {
  const userContext: IRepositoryOptions = await getUserContext(tenantId)
  const integrationService = new IntegrationService(userContext)
  const integration = await integrationService.findById(integrationId)

  if (integration) {
    await checkIntegrationForAllSettings(integration, userContext)
  }
}

/**
 * Check if the integration has data, platform-agnostic.
 * Each setting will contain a timeframe that we want, and some instructions of what to do.
 * If there have not been any activities in the timeframe, we will act accordingly.
 * @param integration The integration to check
 * @param userContext User context
 */
async function checkIntegrationForAllSettings(integration, userContext: IRepositoryOptions) {
  const activityService = new ActivityService(userContext)
  for (const settings of integrationDataCheckerSettings) {
    // This is moment() - the time. For example, moment().subtract(1, 'hour') is 1 hour ago.
    const timestampSinceLastData = generateDate(settings.timeSinceLastData)

    console.log(
      'Integration created at (hour and minute)',
      integration.createdAt.getHours(),
      integration.createdAt.getMinutes(),
    )

    console.log(
      'Timestamp since last data (hour and minute)',
      timestampSinceLastData.hours(),
      timestampSinceLastData.minutes(),
    )

    console.log('Current time (hour and minute)', moment().hours(), moment().minutes())

    if (shouldCheckThisIntegration(integration, settings, timestampSinceLastData)) {
      console.log('Checking integration')
      console.log(
        'Going into if',
        !(settings.type === IntegrationDataCheckerSettingsType.PLATFORM_SPECIFIC) ||
          settings.activityPlatformsAndType?.platforms.includes(integration.platform),
      )
      if (
        !(settings.type === IntegrationDataCheckerSettingsType.PLATFORM_SPECIFIC) ||
        settings.activityPlatformsAndType?.platforms.includes(integration.platform)
      ) {
        console.log('Checking for activity count')
        const activityCount = (
          await activityService.findAndCountAll({
            filter: {
              platform: integration.platform,
              createdAt: {
                gte: timestampSinceLastData,
              },
              ...(settings.type === IntegrationDataCheckerSettingsType.PLATFORM_SPECIFIC && {
                type: settings.activityPlatformsAndType.type,
              }),
            },
            limit: 1,
          })
        ).count

        if (!activityCount) {
          await changeStatusAction(settings, integration, userContext)
          await sendSlackAlertAction(settings, integration, userContext)
          break
        }
      } else {
        console.log('Not going into if')
      }
    } else {
      console.log('Not checking integration')
    }
    console.log('\n\n')
  }
}

function shouldCheckThisIntegration(
  integration: any,
  settings: IntegrationDataCheckerSettings,
  timestampSinceLastData: moment.Moment,
) {
  // We always should be only checking integrations that have been created before the time we want to check.
  // Otherwise, it is never relevant.
  if (integration.createdAt < timestampSinceLastData) {
    // Either we do not care about it being only new integrations,
    // or the integration's createdAt is before the time we want to check + the reset frequency.
    return (
      !settings.onlyNewIntegrations ||
      integration.createdAt > timestampSinceLastData.subtract(1, 'hour')
    )
  }
  return false
}

async function changeStatusAction(
  settings: IntegrationDataCheckerSettings,
  integration,
  userContext: IRepositoryOptions,
) {
  if (settings.actions.changeStatus) {
    const integrationService = new IntegrationService(userContext)
    await integrationService.update(integration.id, {
      status: 'no-data',
    })
  }
}

async function sendSlackAlertAction(
  settings: IntegrationDataCheckerSettings,
  integration,
  userContext: IRepositoryOptions,
) {
  return sendSlackAlert(SlackAlertTypes.DATA_CHECKER, integration, userContext, log, settings)
}

function generateDate(timeframe) {
  const now = moment()
  if (timeframe.includes('hour')) {
    const hours = parseInt(timeframe, 10)
    return now.subtract(hours, 'hours')
  }
  if (timeframe.includes('day')) {
    const days = parseInt(timeframe, 10)
    return now.subtract(days, 'days')
  }
  log.error('Invalid timeframe', timeframe)
  throw new Error('Invalid timeframe')
}

export { integrationDataCheckerWorker }
