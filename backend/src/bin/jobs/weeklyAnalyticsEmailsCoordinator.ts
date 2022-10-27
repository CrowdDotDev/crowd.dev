import { CrowdJob } from '../../types/jobTypes'
import TenantService from '../../services/tenantService'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'

const job: CrowdJob = {
  name: 'Weekly Analytics Emails coordinator',
  cronTime: '0 8 * * MON',
  onTrigger: async () => {
    const tenants = await TenantService._findAndCountAllForEveryUser({})

    for (const tenant of tenants.rows) {
      await sendNodeWorkerMessage(tenant.id, {
        type: NodeWorkerMessageType.NODE_MICROSERVICE,
        tenant: tenant.id,
        service: 'weekly-analytics-emails',
      } as NodeWorkerMessageBase)
    }
  },
}

export default job
