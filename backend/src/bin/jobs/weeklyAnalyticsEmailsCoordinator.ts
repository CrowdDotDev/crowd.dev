import cronGenerator from 'cron-time-generator'
import { CrowdJob } from '../../utils/jobTypes'
import TenantService from '../../services/tenantService'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessage, NodeWorkerMessageType } from '../../serverless/types/worketTypes'

const coordinatorJob: CrowdJob = {
  name: 'Weekly Analytics Emails coordinator',
  cronTime: cronGenerator.everyMondayAt(8),
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

export default coordinatorJob
