import { getServiceLogger } from '@crowd/logging'

import { SlackBotConfig } from './types'

const log = getServiceLogger()

export function getSlackBotConfig(): SlackBotConfig {
  const botToken = process.env.CROWD_SLACK_BOT_TOKEN
  const signingSecret = process.env.CROWD_SLACK_SIGNING_SECRET
  const reviewChannelId = process.env.CROWD_SLACK_REVIEW_CHANNEL_ID
  const reviewerUserIds = parseUserIds(process.env.CROWD_SLACK_REVIEWER_USER_IDS)

  if (!botToken || !signingSecret) {
    log.warn(
      'Slack bot token or signing secret not configured. Set CROWD_SLACK_BOT_TOKEN and CROWD_SLACK_SIGNING_SECRET to enable bot-based Slack features.',
    )
  }

  return { botToken, signingSecret, reviewChannelId, reviewerUserIds }
}

function parseUserIds(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
}
