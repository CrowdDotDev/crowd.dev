import axios from 'axios'
import { Logger } from '@crowd/logging'

export enum SlackAlertTypes {
  DATA_CHECKER = 'data-checker',
  INTEGRATION_ERROR = 'integration-error',
}

interface SendSlackAlertInput {
  slackURL: string
  alertType: SlackAlertTypes
  integration: SlackIntegrationType
  userContext: SlackUserContextType
  log: Logger
  frameworkVersion: 'old' | 'new'
  settings?: IntegrationDataCheckerSettings
}

interface SlackIntegrationType {
  platform: string
  tenantId: string
  id: string
}

interface SlackUserContextType {
  currentTenant: {
    name: string
    plan: string
    isTrial: boolean
  }
}

type IntegrationDataCheckerSettings = {
  timeSinceLastData: string
  onlyNewIntegrations?: boolean
  type: 'regular' | 'platformSpecific'
  activityPlatformsAndType?: {
    platforms: string[]
    type: string
  }
  actions: IntegrationDataCheckerActions
}

type IntegrationDataCheckerActions = {
  sendSlackAlert?: boolean
  changeStatus?: boolean
}

enum IntegrationDataCheckerSettingsType {
  REGULAR = 'regular',
  PLATFORM_SPECIFIC = 'platformSpecific',
}

export async function sendSlackAlert({
  slackURL,
  alertType,
  integration,
  userContext,
  log,
  settings = null,
  frameworkVersion,
}: SendSlackAlertInput) {
  const blocks = getBlocks(
    alertType,
    integration,
    userContext,
    log,
    settings as IntegrationDataCheckerSettings,
    frameworkVersion,
  )
  await axios.post(slackURL, blocks)
}

function getBlocks(
  alertType: SlackAlertTypes,
  integration: SlackIntegrationType,
  userContext: SlackUserContextType,
  log: Logger,
  settings: IntegrationDataCheckerSettings,
  frameworkVersion: 'old' | 'new',
) {
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
              {
                type: 'mrkdwn',
                text: `*Framework Version:*\n${frameworkVersion}`,
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
              {
                type: 'mrkdwn',
                text: `*Framework Version:*\n${frameworkVersion}`,
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
