import { getServiceLogger } from '@crowd/logging'
import cronGenerator from 'cron-time-generator'
import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import TenantRepository from '../../database/repositories/tenantRepository'
import { CrowdJob } from '../../types/jobTypes'

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

  const emitter = await getNodejsWorkerEmitter()
  for (const { id } of tenants) {
    await emitter.enrichOrganizations(id)
  }
}

export default job
