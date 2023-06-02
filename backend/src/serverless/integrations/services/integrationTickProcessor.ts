import { IntegrationRunWorkerEmitter, IntegrationStreamWorkerEmitter } from '@crowd/sqs'
import { processPaginated } from '@crowd/common'
import { INTEGRATION_SERVICES } from '@crowd/integrations'
import { LoggerBase } from '@crowd/logging'
import { IntegrationType } from '@crowd/types'
import {
  getIntegrationRunWorkerEmitter,
  getIntegrationStreamWorkerEmitter,
} from '../../utils/serviceSQS'
import IntegrationRunRepository from '../../../database/repositories/integrationRunRepository'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { NodeWorkerIntegrationCheckMessage } from '../../../types/mq/nodeWorkerIntegrationCheckMessage'
import { NodeWorkerIntegrationProcessMessage } from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { IntegrationServiceBase } from './integrationServiceBase'

export class IntegrationTickProcessor extends LoggerBase {
  private tickTrackingMap: Map<IntegrationType, number> = new Map()

  private emittersInitialized = false

  private intRunWorkerEmitter: IntegrationRunWorkerEmitter

  private intStreamWorkerEmitter: IntegrationStreamWorkerEmitter

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
        await sendNodeWorkerMessage(
          new Date().toISOString(),
          new NodeWorkerIntegrationCheckMessage(intService.type as IntegrationType),
        )
      }
    }
  }

  private async processDelayedTick() {
    await this.initEmitters()
    await this.intRunWorkerEmitter.checkRuns()
    await this.intStreamWorkerEmitter.checkStreams()

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
