import { SlackIntegrationMessage } from '../types/messageTypes'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import sendIntegrationsMessage from '../utils/integrationSQS'
import { PlatformType } from '../../../utils/platforms'

/**
 * Gets all active Slack integrations
 * Generates a new SQS message for each integration.
 *
 */
async function slackCoordinator(): Promise<void> {
  const integrations: Array<any> = await IntegrationRepository.findAllActive(PlatformType.SLACK)
  for (const integration of integrations) {
    const slackSQSMessage: SlackIntegrationMessage = {
      integration: PlatformType.SLACK,
      sleep: 0,
      tenant: integration.tenantId.toString(),
      onboarding: false,
      state: { endpoint: '', page: '', endpoints: [] },
      args: {
        channels: integration.settings.channels || [],
      },
    }
    await sendIntegrationsMessage(slackSQSMessage)
  }
}

export default slackCoordinator
