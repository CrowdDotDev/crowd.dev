import { timeout, IS_DEV_ENV, IS_TEST_ENV } from '@crowd/common'
import cronGenerator from 'cron-time-generator'
import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'
import TenantService from '../../services/tenantService'
import { CrowdJob } from '../../types/jobTypes'

const job: CrowdJob = {
  name: 'Merge suggestions',
  // every 12 hours
  cronTime:
    IS_DEV_ENV || IS_TEST_ENV ? cronGenerator.every(2).minutes() : cronGenerator.every(12).hours(),
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
