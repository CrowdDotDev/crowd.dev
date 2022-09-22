import { DiscordIntegrationMessage } from '../types/messageTypes'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import sendIntegrationsMessage from '../utils/integrationSQS'
import { PlatformType } from '../../../utils/platforms'

/**
 * Gets all active Discord integrations
 * Generates a new SQS message for each integration.
 *
 */
async function discordCoordinator(): Promise<void> {
  const integrations: Array<any> = await IntegrationRepository.findAllActive(PlatformType.DISCORD)
  for (const integration of integrations) {
    const discordSQSMessage: DiscordIntegrationMessage = {
      integration: PlatformType.DISCORD,
      sleep: Math.floor(Math.random() * 1200),
      tenant: integration.tenantId.toString(),
      onboarding: false,
      state: { endpoint: '', page: '', endpoints: [] },
      args: {
        guildId: integration.integrationIdentifier,
        channels: integration.settings.channels || [],
      },
    }
    await sendIntegrationsMessage(discordSQSMessage)
  }
}

export default discordCoordinator
