import { timeout } from '@crowd/common'
import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'
import TenantService from '../../services/tenantService'
import { CrowdJob } from '../../types/jobTypes'

const job: CrowdJob = {
  name: 'Weekly Analytics Emails coordinator',
  cronTime: '0 8 * * MON',
  onTrigger: async () => {
    const tenants = await TenantService._findAndCountAllForEveryUser({})

    const emitter = await getNodejsWorkerEmitter()
    for (const tenant of tenants.rows) {
      await emitter.weeklyAnalyticsEmail(tenant.id)

      // Wait 1 second between messages to potentially reduce spike load on cube between each tenant runs
      await timeout(1000)
    }
  },
}

export default job
