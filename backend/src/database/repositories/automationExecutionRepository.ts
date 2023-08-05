/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import { DbAutomationExecutionInsertData } from './types/automationTypes'
import {
  AutomationExecution,
  AutomationExecutionCriteria,
  AutomationExecutionState,
} from '../../types/automationTypes'
import { PageData } from '../../types/common'
import { RepositoryBase } from './repositoryBase'

export default class AutomationExecutionRepository extends RepositoryBase<
  AutomationExecution,
  string,
  DbAutomationExecutionInsertData,
  unknown,
  AutomationExecutionCriteria
> {
  public constructor(options: IRepositoryOptions) {
    super(options, false)
  }

  override async create(data: DbAutomationExecutionInsertData): Promise<AutomationExecution> {
    const transaction = this.transaction

    return this.database.automationExecution.create(
      {
        automationId: data.automationId,
        type: data.type,
        tenantId: data.tenantId,
        trigger: data.trigger,
        state: data.state,
        error: data.error,
        executedAt: data.executedAt,
        eventId: data.eventId,
        payload: data.payload,
      },
      { transaction },
    )
  }

  override async findAndCountAll(
    criteria: AutomationExecutionCriteria,
  ): Promise<PageData<AutomationExecution>> {
    // get current tenant that was used to make a request
    const currentTenant = this.currentTenant

    // get plain sequelize object to use with a raw query
    const seq = this.seq

    // construct a query with pagination
    const query = `
      select id,
             "automationId",
             state,
             error,
             "executedAt",
             "eventId",
             payload,
             count(*) over () as "paginatedItemsCount"
      from "automationExecutions"
      where "tenantId" = :tenantId
        and "automationId" = :automationId
      order by "executedAt" desc
      limit ${criteria.limit} offset ${criteria.offset}
      
    `

    const results = await seq.query(query, {
      replacements: {
        tenantId: currentTenant.id,
        automationId: criteria.automationId,
      },
      type: QueryTypes.SELECT,
    })

    if (results.length === 0) {
      return {
        rows: [],
        count: 0,
        offset: criteria.offset,
        limit: criteria.limit,
      }
    }

    const count = parseInt((results[0] as any).paginatedItemsCount, 10)
    const rows: AutomationExecution[] = results.map((r) => {
      const row = r as any
      return {
        id: row.id,
        automationId: row.automationId,
        executedAt: row.executedAt,
        eventId: row.eventId,
        payload: row.payload,
        error: row.error,
        state: row.state,
      }
    })

    return {
      rows,
      count,
      offset: criteria.offset,
      limit: criteria.limit,
    }
  }

  public async hasAlreadyBeenTriggered(automationId: string, eventId: string): Promise<boolean> {
    const seq = this.seq

    const query = `
        select id
        from "automationExecutions"
        where "automationId" = :automationId
          and "eventId" = :eventId
          and state = '${AutomationExecutionState.SUCCESS}';
    `

    const results = await seq.query(query, {
      replacements: {
        automationId,
        eventId,
      },
      type: QueryTypes.SELECT,
    })

    return results.length > 0
  }

  override async update(id: string, data: unknown): Promise<AutomationExecution> {
    throw new Error('Method not implemented.')
  }

  override async destroy(id: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async destroyAllAutomation(automationIds: string[]): Promise<void> {
    const transaction = this.transaction

    const seq = this.seq

    const currentTenant = this.currentTenant

    const query = `
    delete 
    from "automationExecutions"
    where "automationId" in (:automationIds)
      and "tenantId" = :tenantId;`

    await seq.query(query, {
      replacements: {
        automationIds,
        tenantId: currentTenant.id,
      },
      type: QueryTypes.DELETE,
      transaction,
    })
  }

  override async destroyAll(ids: string[]): Promise<void> {
    throw new Error('Method not implemented.')
  }

  override async findById(id: string): Promise<AutomationExecution> {
    throw new Error('Method not implemented.')
  }
}
