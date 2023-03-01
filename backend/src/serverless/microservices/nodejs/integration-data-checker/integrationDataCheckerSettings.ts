import { IntegrationDataCheckerSettings } from './integrationDataCheckerTypes'

// Enum
export enum IntegrationDataCheckerSettingsType {
  REGULAR = 'regular',
  PLATFORM_SPECIFIC = 'platformSpecific',
}

export const integrationDataCheckerSettings: IntegrationDataCheckerSettings[] = [
  {
    timeSinceLastData: '2 hours',
    changeStatus: true,
    onlyNewIntegrations: true,
    actions: { sendSlackAlert: true, changeStatus: true },
    type: IntegrationDataCheckerSettingsType.REGULAR,
  },
  {
    timeSinceLastData: '2 hours',
    changeStatus: true,
    onlyNewIntegrations: true,
    actions: { sendSlackAlert: true, changeStatus: true },
    type: IntegrationDataCheckerSettingsType.PLATFORM_SPECIFIC,
    activityTye: 'message',
  },
]
