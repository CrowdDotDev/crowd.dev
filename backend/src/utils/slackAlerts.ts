import axios from 'axios'
import { IntegrationDataCheckerSettings } from '../serverless/microservices/nodejs/integration-data-checker/integrationDataCheckerTypes'
import { IRepositoryOptions } from '../database/repositories/IRepositoryOptions'
import { IntegrationDataCheckerSettingsType } from '../serverless/microservices/nodejs/integration-data-checker/integrationDataCheckerSettings'
import { SLACK_ALERTING_CONFIG } from '../conf'

export enum SlackAlertTypes {
  DATA_CHECKER = 'data-checker',
  INTEGRATION_ERROR = 'integration-error',
}

export async function sendSlackAlert(
  alertType: string,
  integration: any,
  userContext: IRepositoryOptions,
  log,
  settings: IntegrationDataCheckerSettings | {} = {},
) {
  const blocks = getBlocks(alertType, integration, userContext, log, settings)
  const url = SLACK_ALERTING_CONFIG.url
  await axios.post(url, blocks)
}

function getBlocks(alertType, integration, userContext, log, settings) {
  const tenantName = userContext.currentTenant.name
  const isPayingCustomer = userContext.currentTenant.plan !== 'Essential'
  const isTrial = userContext.currentTenant.isTrial
  const payingCustomerMarker = `✅ ${isTrial ? ' (trial)' : ''}`
  switch (alertType) {
    case SlackAlertTypes.DATA_CHECKER:
      return {
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
                text: `*Time since last data:*\n${settings.timeSinceLastData}`,
              },
              {
                type: 'mrkdwn',
                text: `*Notified user (in-app):* ${settings.actions.changeStatus ? '✔️' : '✖️'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Platform:*\n${integration.platform}`,
              },
              {
                type: 'mrkdwn',
                text:
                  settings.type === IntegrationDataCheckerSettingsType.PLATFORM_SPECIFIC
                    ? `*Activity type:*\n${settings.activityPlatformsAndType.type}`
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
    case SlackAlertTypes.INTEGRATION_ERROR:
      return {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${isPayingCustomer ? '🚨' : '✋🏼'} *Integration onboarding failed* ${
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
                text: `*Platform:*\n${integration.platform}`,
              },
              {
                type: 'mrkdwn',
                text: ' ',
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
    default:
      log.warn('Invalid alert type. Not sending message')
      return null
  }
}
