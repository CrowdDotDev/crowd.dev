import cronGenerator from 'cron-time-generator'
import { NodeWorkerMessageType } from '../../serverless/types/worketTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { CrowdJob } from '../../utils/jobTypes'

const job: CrowdJob = {
  name: 'DEV.to coordinator',
  // every two hours
  cronTime: cronGenerator.every(1).minutes(),
  onTrigger: async () => {
    await sendNodeWorkerMessage('global', {
      type: NodeWorkerMessageType.INTEGRATION_TICK,
    })
  },
}

export default job
