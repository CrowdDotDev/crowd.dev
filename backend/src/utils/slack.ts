import { WebClient } from '@slack/web-api'
import { SLACK_CONFIG } from '../config'

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
    console.log('Warning: no Slack client defined! Can not send a slack message!')
  }
}
