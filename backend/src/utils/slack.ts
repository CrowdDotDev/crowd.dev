import { WebClient } from '@slack/web-api'
import { getServiceChildLogger } from '@crowd/logging'
import { SLACK_CONFIG } from '../conf'

const log = getServiceChildLogger('slackClient')

let slackClientInstance: WebClient | undefined

if (SLACK_CONFIG.reporterToken && SLACK_CONFIG.reporterChannel) {
  slackClientInstance = new WebClient(SLACK_CONFIG.reporterToken)
}

export const sendSlackAlert = async (text: string): Promise<void> => {
  if (slackClientInstance) {
    await slackClientInstance.chat.postMessage({
      channel: SLACK_CONFIG.reporterChannel,
      text,
      username: 'Alert Reporter',
      icon_emoji: ':warning:',
    })
  } else {
    log.warn('No Slack client defined! Can not send a slack message!')
  }
}

export const sendSlackError = async (source: string, error: any): Promise<void> => {
  if (slackClientInstance) {
    await slackClientInstance.chat.postMessage({
      channel: SLACK_CONFIG.reporterChannel,
      text: `Error from ${source}:`,
      username: 'Error Reporter',
      icon_emoji: ':warning:',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\`\`\`${JSON.stringify(error, null, 2)}\`\`\``,
          },
        },
      ],
    })
  }
}
