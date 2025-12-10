export enum SlackChannel {
  ALERTS = 'ALERTS',
  DATA_ALERTS = 'DATA_ALERTS',
  INTEGRATION_NOTIFICATIONS = 'INTEGRATION_NOTIFICATIONS',
  NANGO_ALERTS = 'NANGO_ALERTS',
}

export enum SlackPersona {
  ERROR_REPORTER = 'ERROR_REPORTER',
  INFO_NOTIFIER = 'INFO_NOTIFIER',
  WARNING_PROPAGATOR = 'WARNING_PROPAGATOR',
  SUCCESS_ANNOUNCER = 'SUCCESS_ANNOUNCER',
  DEBUG_TRACKER = 'DEBUG_TRACKER',
  CRITICAL_ALERTER = 'CRITICAL_ALERTER',
}

export interface SlackPersonaConfig {
  name: string
  icon: string
}

export interface SlackMessageSection {
  title: string
  text: string
}

export interface SlackMessage {
  channel: SlackChannel
  persona: SlackPersona
  title: string
  content: string | SlackMessageSection[]
}

export interface SlackChannelConfig {
  webhookUrl: string | undefined
}
