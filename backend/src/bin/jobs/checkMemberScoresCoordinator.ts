import cronGenerator from 'cron-time-generator'
import { CrowdJob } from '../../types/jobTypes'
import { sendPythonWorkerMessage } from '../../serverless/utils/pythonWorkerSQS'
import { PythonWorkerMessageType } from '../../serverless/types/worketTypes'

const job: CrowdJob = {
  name: 'Check Member Scores coordinator',
  cronTime: cronGenerator.every(2).hours(),
  onTrigger: async () => {
    await sendPythonWorkerMessage('global', {
      type: PythonWorkerMessageType.MEMBERS_SCORE,
    })
  },
}

export default job
