import cronGenerator from 'cron-time-generator'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import { DevtoIntegrationMessage } from '../../serverless/integrations/types/messageTypes'
import { CrowdJob } from '../../utils/jobTypes'
import { PlatformType } from '../../utils/platforms'
import { NodeWorkerMessageType } from '../../serverless/types/worketTypes'

const coordinatorJob: CrowdJob = {
  name: 'DEV.to coordinator',
  // every two hours
  cronTime: cronGenerator.every(2).minutes(),
  onTrigger: async () => {
    const integrations: any[] = await IntegrationRepository.findAllActive(PlatformType.DEVTO)

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

      await sendNodeWorkerMessage(integration.tenantId.toString(), {
        type: NodeWorkerMessageType.DEVTO_INTEGRATION,
        ...sqsMessage,
      })
    }
  },
}

export default coordinatorJob
