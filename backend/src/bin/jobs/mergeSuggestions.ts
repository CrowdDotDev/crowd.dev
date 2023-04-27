import TenantService from '../../services/tenantService'
import { CrowdJob } from '../../types/jobTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { timeout } from '../../utils/timing'

const job: CrowdJob = {
  name: 'Merge suggestions',
  // every hour
  // cronTime: '0 * * * *',
  // every 5 minutes
  cronTime: '*/5 * * * *',
  onTrigger: async () => {
    const tenants = await TenantService._findAndCountAllForEveryUser({})
    for (const tenant of tenants.rows) {
      if (tenant.id === '6fe453b9-3ce0-4db9-b5c2-0a7cc52d91ca') {
        console.log('\n\n SENDING FOR THE SPECIFIED TENANT \n\n')
        await sendNodeWorkerMessage(tenant.id, {
          type: NodeWorkerMessageType.NODE_MICROSERVICE,
          tenant: tenant.id,
          service: 'merge-suggestions',
        } as NodeWorkerMessageBase)

        // Wait 1 second between messages to potentially reduce spike load on cube between each tenant runs
        await timeout(1000)
      }
    }
  },
}

export default job
