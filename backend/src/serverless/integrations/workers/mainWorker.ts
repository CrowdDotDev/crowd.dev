import {
  IntegrationsMessage,
  SlackIntegrationMessage,
  TwitterIntegrationMessage,
  TwitterReachMessage,
  GithubIntegrationMessage,
} from '../types/messageTypes'
import { twitterReachWorker, twitterWorker } from './twitterWorker'
import slackWorker from './slackWorker'
import githubWorker from './githubWorker'
import { IntegrationType } from '../../../types/integrationEnums'

async function mainWorker(event: IntegrationsMessage) {
  console.log('Starting main worker with event, ', event)
  let { integration } = event
  integration = integration.toLowerCase()
  switch (integration) {
    case IntegrationType.TWITTER:
      return twitterWorker(event as TwitterIntegrationMessage)
    case IntegrationType.TWITTER_REACH:
      return twitterReachWorker(event as TwitterReachMessage)
    case IntegrationType.SLACK:
      return slackWorker(event as SlackIntegrationMessage)
    case IntegrationType.GITHUB:
      return githubWorker(event as GithubIntegrationMessage)
    default:
      throw new Error('Invalid integration')
  }
}

export default mainWorker
