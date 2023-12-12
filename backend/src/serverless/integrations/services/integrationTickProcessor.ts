import { processPaginated, singleOrDefault } from '@crowd/common'
import { INTEGRATION_SERVICES } from '@crowd/integrations'
import { LoggerBase, getChildLogger } from '@crowd/logging'
import {
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  DataSinkWorkerEmitter,
} from '@crowd/sqs'
import { IntegrationRunState, IntegrationType , TenantPlans } from '@crowd/types'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import MicroserviceRepository from '@/database/repositories/microserviceRepository'
import IntegrationRepository from '@/database/repositories/integrationRepository'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import IntegrationRunRepository from '../../../database/repositories/integrationRunRepository'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { NodeWorkerIntegrationProcessMessage } from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import {
  getIntegrationRunWorkerEmitter,
  getIntegrationStreamWorkerEmitter,
  getDataSinkWorkerEmitter,
} from '../../utils/serviceSQS'
import { IntegrationServiceBase } from './integrationServiceBase'

export class IntegrationTickProcessor extends LoggerBase {
  private tickTrackingMap: Map<IntegrationType, number> = new Map()

  private emittersInitialized = false

  private intRunWorkerEmitter: IntegrationRunWorkerEmitter

  private intStreamWorkerEmitter: IntegrationStreamWorkerEmitter

  private dataSinkWorkerEmitter: DataSinkWorkerEmitter

  constructor(
    options: IServiceOptions,
    private readonly integrationServices: IntegrationServiceBase[],
    private readonly integrationRunRepository: IntegrationRunRepository,
  ) {
    super(options.log)

    for (const intService of this.integrationServices) {
      this.tickTrackingMap[intService.type] = 0
    }

    for (const intService of INTEGRATION_SERVICES) {
      this.tickTrackingMap[intService.type] = 0
    }
  }

  async initEmitters() {
    if (!this.emittersInitialized) {
      this.intRunWorkerEmitter = await getIntegrationRunWorkerEmitter()
      this.intStreamWorkerEmitter = await getIntegrationStreamWorkerEmitter()
      this.dataSinkWorkerEmitter = await getDataSinkWorkerEmitter()

      this.emittersInitialized = true
    }
  }

  async processTick(): Promise<void> {
    await this.processCheckTick()
    await this.processDelayedTick()
  }

  private async processCheckTick() {
    this.log.trace('Processing integration processor tick!')

    const tickers: IIntTicker[] = this.integrationServices.map((i) => ({
      type: i.type,
      ticksBetweenChecks: i.ticksBetweenChecks,
    }))

    for (const service of INTEGRATION_SERVICES) {
      tickers.push({
        type: service.type,
        ticksBetweenChecks: service.checkEvery || -1,
      })
    }

    const promises: Promise<void>[] = []

    for (const intService of tickers) {
      let trigger = false

      if (intService.ticksBetweenChecks < 0) {
        this.log.debug({ type: intService.type }, 'Integration is set to never be triggered.')
      } else if (intService.ticksBetweenChecks === 0) {
        this.log.warn({ type: intService.type }, 'Integration is set to be always triggered.')
        trigger = true
      } else {
        this.tickTrackingMap[intService.type]++

        if (this.tickTrackingMap[intService.type] === intService.ticksBetweenChecks) {
          this.log.info(
            { type: intService.type, tickCount: intService.ticksBetweenChecks },
            'Integration is being triggered since it reached its target tick count!',
          )
          trigger = true
          this.tickTrackingMap[intService.type] = 0
        }
      }

      if (trigger) {
        this.log.info({ type: intService.type }, 'Triggering integration check!')
        promises.push(
          this.processCheck(intService.type as IntegrationType).catch((err) => {
            this.log.error(err, 'Error while processing integration check!')
          }),
        )
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises)
    }
  }

  async processCheck(type: IntegrationType) {
    const logger = getChildLogger('processCheck', this.log, { IntegrationType: type })
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
            logger.debug(
              { integrationIds: integrations.map((i) => i.id) },
              'Found old integrations to check!',
            )
            const inactiveIntegrations: any[] = []
            for (const integration of integrations as any[]) {
              const existingRun = await this.integrationRunRepository.findLastProcessingRun(
                integration.id,
              )
              if (!existingRun) {
                inactiveIntegrations.push(integration)
              }
            }

            if (inactiveIntegrations.length > 0) {
              logger.info(
                { integrationIds: inactiveIntegrations.map((i) => i.id) },
                'Triggering old integration checks!',
              )
              await intService.triggerIntegrationCheck(inactiveIntegrations, options)
            }
          },
        )
      } else {
        const newIntService = singleOrDefault(INTEGRATION_SERVICES, (i) => i.type === type)

        if (!newIntService) {
          throw new Error(`No integration service found for type ${type}!`)
        }

        const emitter = await getIntegrationRunWorkerEmitter()

        await processPaginated(
          async (page) => IntegrationRepository.findAllActive(type, page, 10),
          async (integrations) => {
            logger.debug(
              { integrationIds: integrations.map((i) => i.id) },
              'Found new integrations to check!',
            )
            for (const integration of integrations as any[]) {
              const existingRun =
                await this.integrationRunRepository.findLastProcessingRunInNewFramework(
                  integration.id,
                )
              if (!existingRun) {
                const CHUNKS = 3 // Define the number of chunks
                const DELAY_BETWEEN_CHUNKS = 30 * 60 * 1000 // Define the delay between chunks in milliseconds
                const rand = Math.random() * CHUNKS
                const chunkIndex = Math.min(Math.floor(rand), CHUNKS - 1)
                const delay = chunkIndex * DELAY_BETWEEN_CHUNKS

                // Divide integrations into chunks for Discord
                if (newIntService.type === IntegrationType.DISCORD && integration.tenant.plan !== TenantPlans.Essential) {
                  setTimeout(async () => {
                    logger.info(
                      { integrationId: integration.id },
                      `Triggering new delayed integration check for Discord in ${
                        delay / 60 / 1000
                      } minutes!`,
                    )
                    await emitter.triggerIntegrationRun(
                      integration.tenantId,
                      integration.platform,
                      integration.id,
                      false,
                    )
                  }, delay)
                } else {
                  logger.info(
                    { integrationId: integration.id },
                    'Triggering new integration check!',
                  )
                  await emitter.triggerIntegrationRun(
                    integration.tenantId,
                    integration.platform,
                    integration.id,
                    false,
                  )
                }
              } else {
                logger.info({ integrationId: integration.id }, 'Existing run found, skipping!')
              }
            }
          },
        )
      }
    }
  }

  private async processDelayedTick() {
    await this.initEmitters()
    await this.intRunWorkerEmitter.checkRuns()
    await this.intStreamWorkerEmitter.checkStreams()
    await this.dataSinkWorkerEmitter.checkResults()

    // TODO check streams as well
    this.log.trace('Checking for delayed integration runs!')

    await processPaginated(
      async (page) => this.integrationRunRepository.findDelayedRuns(page, 10),
      async (delayedRuns) => {
        for (const run of delayedRuns) {
          this.log.info({ runId: run.id }, 'Triggering delayed integration run processing!')

          await sendNodeWorkerMessage(
            new Date().toISOString(),
            new NodeWorkerIntegrationProcessMessage(run.id),
          )
        }
      },
    )
  }
}

interface IIntTicker {
  type: string
  ticksBetweenChecks: number
}
