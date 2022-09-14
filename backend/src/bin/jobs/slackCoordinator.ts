import cronGenerator from 'cron-time-generator'
import { CrowdJob } from '../../utils/jobTypes'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import { PlatformType } from '../../utils/platforms'
import { SlackIntegrationMessage } from '../../serverless/integrations/types/messageTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/worketTypes'

const coordinatorJob: CrowdJob = {
  name: 'Slack coordinator',
  cronTime: cronGenerator.every(20).minutes(),
  onTrigger: async () => {
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
      await sendNodeWorkerMessage(integration.tenantId.toString(), {
        type: NodeWorkerMessageType.INTEGRATION,
        ...slackSQSMessage,
      })
    }
  },
}

export default coordinatorJob
