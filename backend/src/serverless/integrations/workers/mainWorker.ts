import { IntegrationsMessage, GithubIntegrationMessage } from '../types/messageTypes'
import githubWorker from './githubWorker'
import { IntegrationType } from '../../../types/integrationEnums'

async function mainWorker(event: IntegrationsMessage) {
  console.log('Starting main worker with event, ', event)
  let { integration } = event
  integration = integration.toLowerCase()
  switch (integration) {
    case IntegrationType.GITHUB:
      return githubWorker(event as GithubIntegrationMessage)
    default:
      throw new Error('Invalid integration')
  }
}

export default mainWorker
