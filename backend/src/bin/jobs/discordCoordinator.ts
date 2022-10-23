import cronGenerator from 'cron-time-generator'
import { CrowdJob } from '../../utils/jobTypes'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import { PlatformType } from '../../utils/platforms'
import { DiscordIntegrationMessage } from '../../serverless/integrations/types/messageTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'

const job: CrowdJob = {
  name: 'Discord coordinator',
  cronTime: cronGenerator.every(20).minutes(),
  onTrigger: async () => {
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

      await sendNodeWorkerMessage(integration.tenantId.toString(), {
        type: NodeWorkerMessageType.INTEGRATION,
        ...discordSQSMessage,
      })
    }
  },
}

export default job
