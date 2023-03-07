import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'

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

    for (const integration of integrations) {
      await sendNodeWorkerMessage(integration.id, {
        tenantId: integration.tenantId,
        type: NodeWorkerMessageType.NODE_MICROSERVICE,
        integrationId: integration.id,
        service: 'integration-data-checker',
      } as NodeWorkerMessageBase)
    }
  },
}

export default job
