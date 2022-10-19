import cronGenerator from 'cron-time-generator'
import { CrowdJob } from '../../types/jobTypes'
import TenantService from '../../services/tenantService'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/worketTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'

const job: CrowdJob = {
  name: 'Weekly Analytics Emails coordinator',
  cronTime: cronGenerator.everyMondayAt(8),
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
