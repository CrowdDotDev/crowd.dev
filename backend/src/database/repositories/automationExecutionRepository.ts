import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import { DbAutomationExecutionInsertData } from './types/automationTypes'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import { AutomationExecution } from '../../types/automationTypes'
import { PageData } from '../../types/common'

const log: boolean = false

export default class AutomationExecutionRepository {
  static async create(
    data: DbAutomationExecutionInsertData,
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.automationExecution.create(
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

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)
  }

  static async listForAutomationId(
    automationId: string,
    offset: number,
    limit: number,
    options: IRepositoryOptions,
  ): Promise<PageData<AutomationExecution>> {
    // get current tenant that was used to make a request
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    // get plain sequelize object to use with a raw query
    const seq = SequelizeRepository.getSequelize(options)

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
      limit ${limit} offset ${offset}
    `

    const results = await seq.query(query, {
      replacements: {
        tenantId: currentTenant.id,
        automationId,
      },
      type: QueryTypes.SELECT,
    })

    if (results.length === 0) {
      return {
        rows: [],
        count: 0,
        limit,
        offset,
      }
    }

    const count = (results[0] as any).paginatedItemsCount as number
    const rows: AutomationExecution[] = results.map((r) => {
      const d = r as any
      return {
        id: d.id,
        automationId: d.automationId,
        executedAt: d.executedAt,
        eventId: d.eventId,
        payload: d.payload,
        error: d.error,
        state: d.state,
      }
    })

    return {
      rows,
      count,
      limit,
      offset,
    }
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions): Promise<void> {
    if (log) {
      let values = {}

      if (data) {
        values = {
          ...record.get({ plain: true }),
        }
      }

      await AuditLogRepository.log(
        {
          entityName: 'automationExecution',
          entityId: record.id,
          action,
          values,
        },
        options,
      )
    }
  }
}
