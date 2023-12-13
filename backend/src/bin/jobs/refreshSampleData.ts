import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'
import { CrowdJob } from '../../types/jobTypes'

const job: CrowdJob = {
  name: 'Refresh sample data',
  // every day
  cronTime: '0 0 * * *',
  onTrigger: async () => {
    const emitter = await getNodejsWorkerEmitter()
    await emitter.refreshSampleData()
  },
}

export default job
