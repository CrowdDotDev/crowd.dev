import cronGenerator from 'cron-time-generator'
import { timeout } from '@crowd/common'
import TenantService from '../../services/tenantService'
import { CrowdJob } from '../../types/jobTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'

const job: CrowdJob = {
  name: 'Merge suggestions',
  // every 12 hours
  cronTime: cronGenerator.every(12).hours(),
  onTrigger: async () => {
    const tenants = await TenantService._findAndCountAllForEveryUser({})
    for (const tenant of tenants.rows) {
      await sendNodeWorkerMessage(tenant.id, {
        type: NodeWorkerMessageType.NODE_MICROSERVICE,
        tenant: tenant.id,
        service: 'merge-suggestions',
      } as NodeWorkerMessageBase)

      await timeout(300)
    }
  },
}

export default job
