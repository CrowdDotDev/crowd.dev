import { QueryTypes } from 'sequelize'
import AuditLogRepository from './auditLogRepository'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'
import Error404 from '../../errors/Error404'
import { AutomationCriteria, AutomationData } from '../../types/automationTypes'
import { DbAutomationInsertData, DbAutomationUpdateData } from './types/automationTypes'
import { PageData } from '../../types/common'

const log: boolean = false

export default class AutomationRepository {
  static async create(
    data: DbAutomationInsertData,
    options: IRepositoryOptions,
  ): Promise<AutomationData> {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.automation.create(
      {
        type: data.type,
        trigger: data.trigger,
        settings: data.settings,
        state: data.state,
        tenantId: tenant.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    const results = await this.find(
      {
        id: record.id,
      },
      0,
      1,
      options,
    )

    return results.rows[0]
  }

  static async update(
    id,
    data: DbAutomationUpdateData,
    options: IRepositoryOptions,
  ): Promise<AutomationData> {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.automation.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    record = await record.update(
      {
        trigger: data.trigger,
        settings: data.settings,
        state: data.state,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    const results = await this.find(
      {
        id: record.id,
      },
      0,
      1,
      options,
    )

    return results.rows[0]
  }

  static async destroy(id, options: IRepositoryOptions): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.automation.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    await record.destroy({
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id: string, options: IRepositoryOptions): Promise<AutomationData> {
    const results = await this.find(
      {
        id,
      },
      0,
      1,
      options,
    )

    if (results.count === 1) {
      return results.rows[0]
    }

    if (results.count === 0) {
      throw new Error404()
    }

    throw new Error('More than one row returned when fetching by automation unique ID!')
  }

  static async find(
    criteria: AutomationCriteria,
    offset: number,
    limit: number,
    options: IRepositoryOptions,
  ): Promise<PageData<AutomationData>> {
    // get current tenant that was used to make a request
    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    // get plain sequelize object to use with a raw query
    const seq = SequelizeRepository.getSequelize(options)

    // build a where condition based on tenant and other criteria passed as parameter
    const conditions = ['a."deletedAt" is null', 'a."tenantId" = :tenantId']
    const parameters: any = {
      tenantId: currentTenant.id,
    }

    if (criteria.id) {
      conditions.push('a.id = :id')
      parameters.id = criteria.id
    }

    if (criteria.state) {
      conditions.push('a.state = :state')
      parameters.state = criteria.state
    }

    if (criteria.type) {
      conditions.push('a.type = :type')
      parameters.type = criteria.type
    }

    if (criteria.trigger) {
      conditions.push('a.trigger = :trigger')
      parameters.trigger = criteria.trigger
    }

    const conditionsString = conditions.join(' and ')

    const query = `
    -- common table expression (CTE) to prepare the last execution information for each automationId
      with latest_executions as (select distinct on ("automationId") "automationId", "executedAt", state, error
                                from "automationExecutions"
                                order by "automationId", "executedAt" desc)
      select a.id,
            a.type,
            a."tenantId",
            a.trigger,
            a.settings,
            a.state,
            a."createdAt",
            le."executedAt" as "lastExecutionAt",
            le.state        as "lastExecutionState",
            le.error        as "lastExecutionError",
            count(*) over () as "paginatedItemsCount"
      from automations a
              left join latest_executions le on a.id = le."automationId"
      where ${conditionsString}
      limit ${limit} offset ${offset}
    `
    // fetch all automations for a tenant
    // and include the latest execution data if available
    const results = await seq.query(query, {
      replacements: parameters,
      type: QueryTypes.SELECT,
    })

    if (results.length === 0) {
      return {
        rows: [],
        count: 0,
        offset,
        limit,
      }
    }

    const count = (results[0] as any).paginatedItemsCount as number
    const rows: AutomationData[] = results.map((r) => {
      const d = r as any
      return {
        id: d.id,
        type: d.type,
        tenantId: d.tenantId,
        trigger: d.trigger,
        settings: d.settings,
        state: d.state,
        createdAt: d.createdAt,
        lastExecutionAt: d.lastExecutionAt,
        lastExecutionState: d.lastExecutionState,
        lastExecutionError: d.lastExecutionError,
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
          entityName: 'automation',
          entityId: record.id,
          action,
          values,
        },
        options,
      )
    }
  }
}
