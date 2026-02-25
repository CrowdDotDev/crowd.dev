import { getServiceLogger } from '@crowd/logging'

import { SlackChannel, SlackChannelConfig } from './types'

const log = getServiceLogger()

const CHANNEL_WEBHOOK_URLS: Record<SlackChannel, string | undefined> = {
  [SlackChannel.ALERTS]: process.env.CM_ALERTS_SLACK_WEBHOOK_URL,
  [SlackChannel.DATA_ALERTS]: process.env.CM_DATA_ALERTS_SLACK_WEBHOOK_URL,
  [SlackChannel.INTEGRATION_NOTIFICATIONS]:
    process.env.CM_INTEGRATION_NOTIFICATIONS_SLACK_WEBHOOK_URL,
  [SlackChannel.NANGO_ALERTS]: process.env.CM_NANGO_ALERTS_SLACK_WEBHOOK_URL,
}

// Check for missing webhook URLs on initialization
function checkChannelConfigurations(): void {
  const channels = Object.values(SlackChannel)
  const missingChannels: string[] = []

  for (const channel of channels) {
    if (!CHANNEL_WEBHOOK_URLS[channel]) {
      missingChannels.push(channel)
    }
  }

  if (missingChannels.length > 0) {
    log.warn(
      { missingChannels },
      `Slack webhook URLs not configured for channels: ${missingChannels.join(', ')}. Set CM_{CHANNEL}_SLACK_WEBHOOK_URL environment variables.`,
    )
  } else {
    log.debug('All Slack channel webhook URLs are configured')
  }
}

// Run initialization check on module load
checkChannelConfigurations()

export function getChannelConfig(channel: SlackChannel): SlackChannelConfig {
  return {
    webhookUrl: CHANNEL_WEBHOOK_URLS[channel],
  }
}
