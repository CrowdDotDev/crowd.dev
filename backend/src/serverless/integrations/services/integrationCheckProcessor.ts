import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import IntegrationRunRepository from '../../../database/repositories/integrationRunRepository'
import MicroserviceRepository from '../../../database/repositories/microserviceRepository'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { LoggingBase } from '../../../services/loggingBase'
import { IntegrationType } from '../../../types/integrationEnums'
import { IntegrationRunState } from '../../../types/integrationRunTypes'
import { NodeWorkerIntegrationProcessMessage } from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { singleOrDefault } from '../../../utils/arrays'
import { createChildLogger } from '../../../utils/logging'
import { processPaginated } from '../../../utils/paginationProcessing'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { IntegrationServiceBase } from './integrationServiceBase'

export class IntegrationCheckProcessor extends LoggingBase {
  constructor(
    options: IServiceOptions,
    private readonly integrationServices: IntegrationServiceBase[],
    private readonly integrationRunRepository: IntegrationRunRepository,
  ) {
    super(options)
  }

  async processCheck(type: IntegrationType) {
    const logger = createChildLogger('processCheck', this.log, { type })
    logger.trace('Processing integration check!')

    if (type === IntegrationType.TWITTER_REACH) {
      await processPaginated(
        async (page) => MicroserviceRepository.findAllByType('twitter_followers', page, 10),
        async (microservices) => {
          this.log.debug({ type, count: microservices.length }, 'Found microservices to check!')
          for (const micro of microservices) {
            const existingRun = await this.integrationRunRepository.findLastProcessingRun(
              undefined,
              micro.id,
            )
            if (!existingRun) {
              const microservice = micro as any

              const run = await this.integrationRunRepository.create({
                microserviceId: microservice.id,
                tenantId: microservice.tenantId,
                onboarding: false,
                state: IntegrationRunState.PENDING,
              })

              this.log.debug({ type, runId: run.id }, 'Triggering microservice processing!')

              await sendNodeWorkerMessage(
                microservice.tenantId,
                new NodeWorkerIntegrationProcessMessage(run.id),
              )
            }
          }
        },
      )
    } else {
      // get the relevant integration service that is supposed to be configured already
      const intService = singleOrDefault(this.integrationServices, (s) => s.type === type)
      const options =
        (await SequelizeRepository.getDefaultIRepositoryOptions()) as IRepositoryOptions

      await processPaginated(
        async (page) => IntegrationRepository.findAllActive(type, page, 10),
        async (integrations) => {
          logger.debug({ count: integrations.length }, 'Found integrations to check!')
          const inactiveIntegrations: any[] = []
          for (const integration of integrations as any[]) {
            const existingRun = await this.integrationRunRepository.findLastProcessingRun(
              integration.id,
            )
            if (!existingRun) {
              inactiveIntegrations.push(integration)
            }
          }
          await intService.triggerIntegrationCheck(inactiveIntegrations, options)
        },
      )
    }
  }
}
