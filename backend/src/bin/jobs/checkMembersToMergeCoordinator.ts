import cronGenerator from 'cron-time-generator'
import { CrowdJob } from '../../utils/jobTypes'
import { sendPythonWorkerMessage } from '../../serverless/utils/pythonWorkerSQS'
import { PythonWorkerMessageType } from '../../serverless/types/worketTypes'

const coordinatorJob: CrowdJob = {
  name: 'Check Members to Merge coordinator',
  cronTime: cronGenerator.every(2).hours(),
  onTrigger: async () => {
    await sendPythonWorkerMessage('global', {
      type: PythonWorkerMessageType.CHECK_MERGE,
    })
  },
}

export default coordinatorJob
