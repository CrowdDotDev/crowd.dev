import { TwitterIntegrationMessage } from '../types/messageTypes'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import sendIntegrationsMessage from '../utils/integrationSQS'
import { PlatformType } from '../../../utils/platforms'

/**
 * Gets all the integrations that have an active twitter integration.
 * Generates a new SQS message for each integration.
 *
 */
async function twitterCoordinator(): Promise<void> {
  const integrations: Array<any> = await IntegrationRepository.findAllActive(PlatformType.TWITTER)
  for (const integration of integrations) {
    const twitterObj: TwitterIntegrationMessage = {
      integration: PlatformType.TWITTER,
      sleep: 0,
      tenant: integration.tenantId.toString(),
      onboarding: false,
      state: { endpoint: '', page: '', endpoints: [] },
      args: {
        profileId: integration.integrationIdentifier,
        hashtags: integration.settings.hashtags,
      },
    }
    await sendIntegrationsMessage(twitterObj)
  }
}

export default twitterCoordinator
