import {
  DevtoIntegrationMessage,
  DiscordIntegrationMessage,
  IntegrationsMessage,
  SlackIntegrationMessage,
  TwitterIntegrationMessage,
  TwitterReachMessage,
  GithubIntegrationMessage,
} from '../types/messageTypes'
import { twitterReachWorker, twitterWorker } from './twitterWorker'
import discordWorker from './discordWorker'
import slackWorker from './slackWorker'
import devtoWorker from './devtoWorker'
import githubWorker from './githubWorker'
import { PlatformType } from '../../../utils/platforms'

async function mainWorker(event: IntegrationsMessage) {
  console.log('Starting main worker with event, ', event)
  let { integration } = event
  integration = integration.toLowerCase()
  switch (integration) {
    case PlatformType.TWITTER:
      return twitterWorker(event as TwitterIntegrationMessage)
    case 'twitter-reach':
      return twitterReachWorker(event as TwitterReachMessage)
    case PlatformType.DISCORD:
      return discordWorker(event as DiscordIntegrationMessage)
    case PlatformType.SLACK:
      return slackWorker(event as SlackIntegrationMessage)
    case PlatformType.DEVTO:
      return devtoWorker(event as DevtoIntegrationMessage)
    case PlatformType.GITHUB:
      return githubWorker(event as GithubIntegrationMessage)
    default:
      throw new Error('Invalid integration')
  }
}

export default mainWorker
