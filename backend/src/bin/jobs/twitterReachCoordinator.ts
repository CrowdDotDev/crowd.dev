import cronGenerator from 'cron-time-generator'
import { CrowdJob } from '../../utils/jobTypes'
import MicroserviceRepository from '../../database/repositories/microserviceRepository'
import { TwitterReachMessage } from '../../serverless/integrations/types/messageTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'

const job: CrowdJob = {
  name: 'Twitter Reach coordinator',
  cronTime: cronGenerator.everyDayAt(7),
  onTrigger: async () => {
    const microservices: Array<any> = await MicroserviceRepository.findAllByType(
      'twitter_followers',
    )
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
      await sendNodeWorkerMessage(microservice.tenantId.toString(), {
        type: NodeWorkerMessageType.INTEGRATION,
        ...twitterObj,
      })
    }
  },
}

export default job
