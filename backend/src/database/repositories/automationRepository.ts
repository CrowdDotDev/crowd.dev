import Sequelize, { QueryTypes } from 'sequelize'

import { Error404 } from '@crowd/common'
import {
  AutomationState,
  AutomationSyncTrigger,
  FeatureFlag,
  IAutomationData,
  PLAN_LIMITS,
  PageData,
} from '@crowd/types'

import { AutomationCriteria } from '../../types/automationTypes'

import { IRepositoryOptions } from './IRepositoryOptions'
import AuditLogRepository from './auditLogRepository'
import { RepositoryBase } from './repositoryBase'
import { DbAutomationInsertData, DbAutomationUpdateData } from './types/automationTypes'

const { Op } = Sequelize

export default class AutomationRepository extends RepositoryBase<
  IAutomationData,
  string,
  DbAutomationInsertData,
  DbAutomationUpdateData,
  AutomationCriteria
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  override async create(data: DbAutomationInsertData): Promise<IAutomationData> {
    const currentUser = this.currentUser

    const tenant = this.currentTenant

    const transaction = this.transaction

    const existingActiveAutomations = await this.findAndCountAll({
      state: AutomationState.ACTIVE,
    })

    const record = await this.database.automation.create(
      {
        name: data.name,
        type: data.type,
        trigger: data.trigger,
        settings: data.settings,
        state:
          existingActiveAutomations.count >= PLAN_LIMITS[tenant.plan][FeatureFlag.AUTOMATIONS]
            ? AutomationState.DISABLED
            : data.state,
        tenantId: tenant.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this.createAuditLog('automation', AuditLogRepository.CREATE, record, data)

    return this.findById(record.id)
  }

  override async update(id, data: DbAutomationUpdateData): Promise<IAutomationData> {
    const currentUser = this.currentUser

    const currentTenant = this.currentTenant

    const transaction = this.transaction

    const existingActiveAutomations = await this.findAndCountAll({
      state: AutomationState.ACTIVE,
    })

    if (
      data.state === AutomationState.ACTIVE &&
      existingActiveAutomations.count >= PLAN_LIMITS[currentTenant.plan][FeatureFlag.AUTOMATIONS]
    ) {
      throw new Error(`Maximum number of active automations reached for the plan!`)
    }

    let record = await this.database.automation.findOne({
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
        name: data.name,
        trigger: data.trigger,
        settings: data.settings,
        state: data.state,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this.createAuditLog('automation', AuditLogRepository.UPDATE, record, data)

    return this.findById(record.id)
  }

  override async destroyAll(ids: string[]): Promise<void> {
    const transaction = this.transaction

    const currentTenant = this.currentTenant

    const records = await this.database.automation.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (ids.some((id) => records.find((r) => r.id === id) === undefined)) {
      throw new Error404()
    }

    await Promise.all(
      records.flatMap((r) => [
        r.destroy({ transaction }),
        this.createAuditLog('automation', AuditLogRepository.DELETE, r, r),
      ]),
    )
  }

  override async findById(id: string): Promise<IAutomationData> {
    const results = await this.findAndCountAll({
      id,
      offset: 0,
      limit: 1,
    })

    if (results.count === 1) {
      return results.rows[0]
    }

    if (results.count === 0) {
      throw new Error404()
    }

    throw new Error('More than one row returned when fetching by automation unique ID!')
  }

  override async findAndCountAll(criteria: AutomationCriteria): Promise<PageData<IAutomationData>> {
    // get current tenant that was used to make a request
    const currentTenant = this.currentTenant

    // we need transaction if there is one set because some records were perhaps created/updated in the same transaction
    const transaction = this.transaction

    // get plain sequelize object to use with a raw query
    const seq = this.seq

    // build a where condition based on tenant and other criteria passed as parameter
    const conditions = ['a."tenantId" = :tenantId']
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
            a.name,
            a.type,
            a."tenantId",
            a.trigger,
            a.settings,
            a.state,
            a."createdAt",
            a."updatedAt",
            le."executedAt" as "lastExecutionAt",
            le.state        as "lastExecutionState",
            le.error        as "lastExecutionError",
            count(*) over () as "paginatedItemsCount"
      from automations a
              left join latest_executions le on a.id = le."automationId"
      where ${conditionsString}
      order by "updatedAt" desc
      ${this.getPaginationString(criteria)}
    `
    // fetch all automations for a tenant
    // and include the latest execution data if available
    const results = await seq.query(query, {
      replacements: parameters,
      type: QueryTypes.SELECT,
      transaction,
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
    const rows: IAutomationData[] = results.map((r) => {
      const row = r as any
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        tenantId: row.tenantId,
        trigger: row.trigger,
        settings: row.settings,
        state: row.state,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        lastExecutionAt: row.lastExecutionAt,
        lastExecutionState: row.lastExecutionState,
        lastExecutionError: row.lastExecutionError,
      }
    })

    return {
      rows,
      count,
      offset: criteria.offset,
      limit: criteria.limit,
    }
  }

  static async countAllActive(database: any, tenantId: string): Promise<number> {
    const automationCount = await database.automation.count({
      where: {
        tenantId,
        state: AutomationState.ACTIVE,
      },
      useMaster: true,
    })

    return automationCount
  }

  public async findSyncAutomations(
    tenantId: string,
    platform: string,
  ): Promise<IAutomationData[] | null> {
    const seq = this.seq

    const transaction = this.transaction

    const pageSize = 10
    const syncAutomations: IAutomationData[] = []

    let results
    let offset

    do {
      offset = results ? pageSize + offset : 0

      results = await seq.query(
        `select * from automations 
      where type = :platform and "tenantId" = :tenantId and trigger in (:syncAutomationTriggers)
      limit :limit offset :offset`,
        {
          replacements: {
            tenantId,
            platform,
            syncAutomationTriggers: [
              AutomationSyncTrigger.MEMBER_ATTRIBUTES_MATCH,
              AutomationSyncTrigger.ORGANIZATION_ATTRIBUTES_MATCH,
            ],
            limit: pageSize,
            offset,
          },
          type: QueryTypes.SELECT,
          transaction,
        },
      )
      syncAutomations.push(...results)
    } while (results.length > 0)

    return syncAutomations
  }
}
