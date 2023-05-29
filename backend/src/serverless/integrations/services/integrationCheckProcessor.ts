import { processPaginated, singleOrDefault } from '@crowd/common'
import { INTEGRATION_SERVICES } from '@crowd/integrations'
import { LoggerBase, getChildLogger } from '@crowd/logging'
import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import IntegrationRunRepository from '../../../database/repositories/integrationRunRepository'
import MicroserviceRepository from '../../../database/repositories/microserviceRepository'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { IntegrationType } from '../../../types/integrationEnums'
import { IntegrationRunState } from '../../../types/integrationRunTypes'
import { NodeWorkerIntegrationProcessMessage } from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { sendGenerateRunStreamsMessage } from '../../utils/integrationRunWorkerSQS'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { IntegrationServiceBase } from './integrationServiceBase'

export class IntegrationCheckProcessor extends LoggerBase {
  constructor(
    options: IServiceOptions,
    private readonly integrationServices: IntegrationServiceBase[],
    private readonly integrationRunRepository: IntegrationRunRepository,
  ) {
    super(options.log)
  }

  async processCheck(type: IntegrationType) {
    const logger = getChildLogger('processCheck', this.log, { type })
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
      const options =
        (await SequelizeRepository.getDefaultIRepositoryOptions()) as IRepositoryOptions

      // get the relevant integration service that is supposed to be configured already
      const intService = singleOrDefault(this.integrationServices, (s) => s.type === type)

      if (intService) {
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
      } else {
        const newIntService = singleOrDefault(INTEGRATION_SERVICES, (i) => i.type === type)

        if (!newIntService) {
          throw new Error(`No integration service found for type ${type}!`)
        }

        await processPaginated(
          async (page) => IntegrationRepository.findAllActive(type, page, 10),
          async (integrations) => {
            logger.debug({ count: integrations.length }, 'Found integrations to check!')
            for (const integration of integrations as any[]) {
              const existingRun =
                await this.integrationRunRepository.findLastProcessingRunInNewFramework(
                  integration.id,
                )
              if (!existingRun) {
                const runId = await this.integrationRunRepository.createInNewFramework({
                  integrationId: integration.id,
                  tenantId: integration.tenantId,
                  onboarding: false,
                  state: IntegrationRunState.PENDING,
                })

                await sendGenerateRunStreamsMessage(integration.tenantId, runId)
              }
            }
          },
        )
      }
    }
  }
}
