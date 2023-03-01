import axios from 'axios'
import moment from 'moment'
// import { S3_CONFIG } from '../../../../config'
// import RecurringEmailsHistoryRepository from '../../../../database/repositories/recurringEmailsHistoryRepository'
// import SequelizeRepository from '../../../../database/repositories/sequelizeRepository'
// import UserRepository from '../../../../database/repositories/userRepository'
import getUserContext from '../../../../database/utils/getUserContext'
import IntegrationService from '../../../../services/integrationService'
import ActivityService from '../../../../services/activityService'
import {
  integrationDataCheckerSettings,
  IntegrationDataCheckerSettingsType,
} from './integrationDataCheckerSettings'
import { IRepositoryOptions } from '../../../../database/repositories/IRepositoryOptions'
// import EagleEyeContentService from '../../../../services/eagleEyeContentService'
// import EagleEyeSettingsService from '../../../../services/eagleEyeSettingsService'
// import EmailSender from '../../../../services/emailSender'
// import getStage from '../../../../services/helpers/getStage'
// import { RecurringEmailType } from '../../../../types/recurringEmailsHistoryTypes'
import { createServiceChildLogger } from '../../../../utils/logging'
import { IntegrationDataCheckerSettings } from './integrationDataCheckerTypes'

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
      const activityCount = (
        await activityService.findAndCountAll({
          filter: {
            platform: integration.platform,
            createdAt: {
              gte: timestampSinceLastData,
            },
            ...(settings.type === IntegrationDataCheckerSettingsType.PLATFORM_SPECIFIC && {
              type: settings.activityTye,
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
      console.log('Not checking integration')
    }
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
  if (settings.actions.sendSlackAlert) {
    try {
      const tenantName = userContext.currentTenant.name
      const timeSinceLastData = settings.timeSinceLastData
      const isPayingCustomer = userContext.currentTenant.plan
      const isTrial = userContext.currentTenant.trialEndsAt > new Date()

      const payingCustomerMarker = `✅ ${isTrial ? ' (trial)' : ''}`

      const url =
        'https://hooks.slack.com/services/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'

      const payload = {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${isPayingCustomer ? '🚨' : '✋🏼'} *Integration not getting data* ${
                isPayingCustomer ? '🚨' : ''
              }`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Tenant Name:*\n${tenantName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Paying customer:* ${isPayingCustomer ? payingCustomerMarker : '❌'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Time since last data:*\n${timeSinceLastData}`,
              },
              {
                type: 'mrkdwn',
                text: ' ',
              },
              {
                type: 'mrkdwn',
                text: `*Platform:*\n${integration.platform}`,
              },
              {
                type: 'mrkdwn',
                text:
                  settings.type === IntegrationDataCheckerSettingsType.PLATFORM_SPECIFIC
                    ? `*Activity type:*\n${settings.activityTye}`
                    : ' ',
              },
              {
                type: 'mrkdwn',
                text: `*Tenant ID:*\n${integration.tenantId}`,
              },
              {
                type: 'mrkdwn',
                text: `*Integration ID:*\n${integration.id}`,
              },
            ],
          },
        ],
      }

      await axios.post(url, payload)
    } catch (error) {
      log.error('Error sending slack alert', error)
    }
  }
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
