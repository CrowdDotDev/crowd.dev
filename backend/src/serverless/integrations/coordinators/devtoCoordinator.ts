import { DevtoIntegrationMessage } from '../types/messageTypes'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import sendIntegrationsMessage from '../utils/integrationSQS'
import { PlatformType } from '../../../utils/platforms'

/**
 * Gets all active devto integrations and triggers
 * a new check for new activities for each integration found
 */
async function devtoCoordinator(): Promise<void> {
  const integrations: Array<any> = await IntegrationRepository.findAllActive(PlatformType.DEVTO)

  console.log(`Found ${integrations.length} devto integrations!`)

  for (const integration of integrations) {
    const sqsMessage: DevtoIntegrationMessage = {
      integration: PlatformType.DEVTO,
      sleep: 0,
      integrationId: integration.id,
      tenant: integration.tenantId.toString(),
      onboarding: false,
      state: { endpoint: '', page: '' },
      args: {},
    }

    await sendIntegrationsMessage(sqsMessage)
  }
}

export default devtoCoordinator
