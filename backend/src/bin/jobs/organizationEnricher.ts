import cronGenerator from 'cron-time-generator'
import { getServiceLogger } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import TenantRepository from '../../database/repositories/tenantRepository'

const job: CrowdJob = {
  name: 'organization enricher',
  cronTime: cronGenerator.everyDay(),
  onTrigger: sendWorkerMessage,
}

async function sendWorkerMessage() {
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const log = getServiceLogger()
  const tenants = await TenantRepository.getPayingTenantIds(options)
  log.info(tenants)
  for (const { id } of tenants) {
    const payload = {
      type: NodeWorkerMessageType.NODE_MICROSERVICE,
      service: 'enrich-organizations',
      tenantId: id,
    } as NodeWorkerMessageBase
    log.info({ payload }, 'enricher worker payload')
    await sendNodeWorkerMessage(id, payload)
  }
}

export default job
