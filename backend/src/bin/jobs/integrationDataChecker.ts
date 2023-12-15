import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'

const job: CrowdJob = {
  name: 'Integration Data Checker',
  // every hour on weekdays
  cronTime: '0 * * * 1-5',
  onTrigger: async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const integrations = await options.database.integration.findAll({
      where: {
        status: 'done',
      },
    })

    const emitter = await getNodejsWorkerEmitter()
    for (const integration of integrations) {
      await emitter.integrationDataChecker(integration.tenantId, integration.id)
    }
  },
}

export default job
