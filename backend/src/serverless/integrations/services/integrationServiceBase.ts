import { Logger } from '../../../utils/logging'
import { ServiceBase } from '../../../utils/serviceBase'

export abstract class IntegrationServiceBase extends ServiceBase {
  public readonly ticksBetweenProcessing: number

  /**
   * Every new integration should extend this class and implement it's methods.
   *
   * @param integrationType What integration is this?
   * @param ticksBetweenProcessing How many ticks to skip between each integration checks (each tick is 1 minute)
   * @param parentLogger
   */
  protected constructor(
    integrationType: string,
    ticksBetweenProcessing: number,
    parentLogger: Logger,
  ) {
    super(parentLogger, { integrationType, ticks: ticksBetweenProcessing })

    this.ticksBetweenProcessing = ticksBetweenProcessing
  }
}
