import {
  AutomationCriteria,
  AutomationData,
  AutomationExecution,
  AutomationExecutionState,
  AutomationState,
  CreateAutomationRequest,
  UpdateAutomationRequest,
} from '../types/automationTypes'
import { IServiceOptions } from './IServiceOptions'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import AutomationRepository from '../database/repositories/automationRepository'
import AutomationExecutionHistoryRepository from '../database/repositories/automationExecutionHistoryRepository'
import { PageData } from '../types/common'

export default class AutomationService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  /**
   * Creates a new active automation
   * @param req {CreateAutomationRequest} data used to create a new automation
   * @returns {AutomationData} object for frontend to use
   */
  async create(req: CreateAutomationRequest): Promise<AutomationData> {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      // create an active automation
      const result = await AutomationRepository.create(
        {
          ...req,
          state: AutomationState.ACTIVE,
        },
        this.options,
      )

      await SequelizeRepository.commitTransaction(transaction)

      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  /**
   * Updates an existing automation.
   * Also used to change automation state - to enable or disable an automation.
   * It updates all the columns at once so all the properties in the request parameter
   * have to be filled.
   * @param id of the existing automation that is being updated
   * @param req {UpdateAutomationRequest} data used to update an existing automation
   * @returns {AutomationData} object for frontend to use
   */
  async update(id: string, req: UpdateAutomationRequest): Promise<AutomationData> {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      // update an existing automation including its state
      const result = await AutomationRepository.update(id, req, this.options)
      await SequelizeRepository.commitTransaction(transaction)
      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  /**
   * Deletes an existing automation
   * @param id automation id to be deleted
   */
  async destroy(id: string): Promise<void> {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      const result = await AutomationRepository.destroy(id, this.options)
      await SequelizeRepository.commitTransaction(transaction)
      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  /**
   * Method used to fetch all tenants automation with filters available in the criteria parameter
   * @param criteria {AutomationCriteria} filters to be used when returning automations
   * @returns {AutomationData[]}
   */
  async list(criteria: AutomationCriteria): Promise<AutomationData[]> {
    return AutomationRepository.find(criteria, this.options)
  }

  /**
   * Method used to fetch a single automation by its id
   * @param id automation id
   * @returns {AutomationData}
   */
  async findById(id: string): Promise<AutomationData> {
    return AutomationRepository.findById(id, this.options)
  }

  /**
   * Method used to fetch all automation executions.
   * @param automationId automation unique ID to fetch executions for
   * @param page which page to list
   * @param perPage how many items per page you want to display
   */
  async listExecutions(
    automationId: string,
    page: number,
    perPage: number,
  ): Promise<PageData<AutomationExecution>> {
    return AutomationExecutionHistoryRepository.listForAutomationId(
      automationId,
      page,
      perPage,
      this.options,
    )
  }

  /**
   * Method used by service that is processing automations as they are triggered
   * @param automation {AutomationData} which automation was triggered
   * @param eventId id of the event that triggered this automation (activity.id or member.id for example)
   * @param payload payload that was sent using this automation
   * @param state whether the execution was successful or not
   * @param error if execution was not successful this will contain information about what happened
   */
  async logExecution(
    automation: AutomationData,
    eventId: string,
    payload: any,
    state: AutomationExecutionState,
    error?: any,
  ) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      await AutomationExecutionHistoryRepository.create(
        {
          automationId: automation.id,
          type: automation.type,
          tenantId: automation.tenantId,
          trigger: automation.trigger,
          error: error !== undefined ? error : null,
          executedAt: new Date().toISOString(),
          state,
          eventId,
          payload,
        },
        this.options,
      )
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }
}
