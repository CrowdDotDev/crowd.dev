import cronGenerator from 'cron-time-generator'
import { CrowdJob } from '../../types/jobTypes'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import { PlatformType } from '../../types/integrationEnums'
import { TwitterIntegrationMessage } from '../../serverless/integrations/types/messageTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/worketTypes'

const job: CrowdJob = {
  name: 'Twitter coordinator',
  cronTime: cronGenerator.every(2).hours(),
  onTrigger: async () => {
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

      await sendNodeWorkerMessage(integration.tenantId.toString(), {
        type: NodeWorkerMessageType.INTEGRATION,
        ...twitterObj,
      })
    }
  },
}

export default job
