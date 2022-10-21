import { CrowdJob } from '../../utils/jobTypes'
import TenantService from '../../services/tenantService'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessage, NodeWorkerMessageType } from '../../serverless/types/worketTypes'

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
      } as NodeWorkerMessage)
    }
  },
}

export default job
