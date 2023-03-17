import { CrowdJob } from '../../types/jobTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'

const job: CrowdJob = {
  name: 'Integration Data Checker',
  // every day
  // cronTime: '0 0 * * *',
  // every minute
  cronTime: '* * * * *',
  onTrigger: async () => {
    console.log('triggering!')
    await sendNodeWorkerMessage('refresh-sample-data', {
      type: NodeWorkerMessageType.NODE_MICROSERVICE,
      service: 'refresh-sample-data',
    } as NodeWorkerMessageBase)
  },
}

export default job
