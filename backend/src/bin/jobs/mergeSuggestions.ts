import { timeout } from '@crowd/common'
import cronGenerator from 'cron-time-generator'
import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'
import TenantService from '../../services/tenantService'
import { CrowdJob } from '../../types/jobTypes'

const job: CrowdJob = {
  name: 'Merge suggestions',
  // every 12 hours
  cronTime: cronGenerator.every(12).hours(),
  onTrigger: async () => {
    const tenants = await TenantService._findAndCountAllForEveryUser({})
    const emitter = await getNodejsWorkerEmitter()

    for (const tenant of tenants.rows) {
      await emitter.mergeSuggestions(tenant.id)

      await timeout(300)
    }
  },
}

export default job
