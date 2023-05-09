import IntegrationRunRepository from '../../../database/repositories/integrationRunRepository'
import { IServiceOptions } from '../../../services/IServiceOptions'
import { LoggingBase } from '../../../services/loggingBase'
import { IntegrationType } from '../../../types/integrationEnums'
import { NodeWorkerIntegrationCheckMessage } from '../../../types/mq/nodeWorkerIntegrationCheckMessage'
import { NodeWorkerIntegrationProcessMessage } from '../../../types/mq/nodeWorkerIntegrationProcessMessage'
import { processPaginated } from '../../../utils/paginationProcessing'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { IntegrationServiceBase } from './integrationServiceBase'

export class IntegrationTickProcessor extends LoggingBase {
  private tickTrackingMap: Map<IntegrationType, number> = new Map()

  constructor(
    options: IServiceOptions,
    private readonly integrationServices: IntegrationServiceBase[],
    private readonly integrationRunRepository: IntegrationRunRepository,
  ) {
    super(options)

    for (const intService of this.integrationServices) {
      this.tickTrackingMap[intService.type] = 0
    }
  }

  async processTick(): Promise<void> {
    await this.processCheckTick()
    await this.processDelayedTick()
  }

  private async processCheckTick() {
    this.log.trace('Processing integration processor tick!')

    for (const intService of this.integrationServices) {
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
          new NodeWorkerIntegrationCheckMessage(intService.type),
        )
      }
    }
  }

  private async processDelayedTick() {
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
