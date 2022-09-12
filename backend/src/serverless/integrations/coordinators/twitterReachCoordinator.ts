import { TwitterReachMessage } from '../types/messageTypes'
import sendIntegrationsMessage from '../utils/integrationSQS'
import MicroserviceRepository from '../../../database/repositories/microserviceRepository'

/**
 * Gets all the microservices that have an active twitter microservice.
 * Generates a new SQS message for each microservice to start the microservice to get the reach.
 *
 */
async function twitterReachCoordinator(): Promise<void> {
  const microservices: Array<any> = await MicroserviceRepository.findAllByType('twitter_followers')
  for (const microservice of microservices) {
    const twitterObj: TwitterReachMessage = {
      integration: 'twitter-reach',
      sleep: 0,
      tenant: microservice.tenantId.toString(),
      onboarding: false,
      state: { endpoint: '', page: '', endpoints: [] },
      args: {
        profileId: microservice.microserviceIdentifier,
      },
    }
    await sendIntegrationsMessage(twitterObj)
  }
}
export default twitterReachCoordinator
