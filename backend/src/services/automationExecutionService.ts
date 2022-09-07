import { ServiceBase } from './serviceBase'
import {
  AutomationExecution,
  AutomationExecutionCriteria,
  CreateAutomationExecutionRequest,
} from '../types/automationTypes'
import { IServiceOptions } from './IServiceOptions'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import AutomationExecutionRepository from '../database/repositories/automationExecutionRepository'
import { PageData } from '../types/common'

export default class AutomationExecutionService extends ServiceBase<
  AutomationExecution,
  string,
  CreateAutomationExecutionRequest,
  unknown,
  AutomationExecutionCriteria
> {
  public constructor(options: IServiceOptions) {
    super(options)
  }

  /**
   * Method used by service that is processing automations as they are triggered
   * @param data {CreateAutomationExecutionRequest} all the necessary data to log a new automation execution
   */
  override async create(data: CreateAutomationExecutionRequest): Promise<AutomationExecution> {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      const record = await new AutomationExecutionRepository(this.options).create({
        automationId: data.automation.id,
        type: data.automation.type,
        tenantId: data.automation.tenantId,
        trigger: data.automation.trigger,
        error: data.error !== undefined ? data.error : null,
        executedAt: new Date(),
        state: data.state,
        eventId: data.eventId,
        payload: data.payload,
      })
      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  /**
   * Method used to fetch all automation executions.
   * @param criteria {AutomationExecutionCriteria} filters to be used when returning automation executions
   * @returns {PageData<AutomationExecution>>}
   */
  override async findAndCountAll(
    criteria: AutomationExecutionCriteria,
  ): Promise<PageData<AutomationExecution>> {
    return new AutomationExecutionRepository(this.options).findAndCountAll(criteria)
  }
}
