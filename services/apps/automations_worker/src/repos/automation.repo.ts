import { Logger } from '@crowd/logging'
import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import {
  AutomationExecutionState,
  AutomationSettings,
  AutomationState,
  AutomationSyncTrigger,
  AutomationTrigger,
  AutomationType,
} from '@crowd/types'

export interface IRelevantAutomationData {
  id: string
  type: AutomationType
  settings: AutomationSettings
  trigger: AutomationTrigger
  slackWebHook: string | null
}

export interface IDbAutomationExecutionInsertData {
  automationId: string
  type: AutomationType
  tenantId: string
  trigger: AutomationTrigger | AutomationSyncTrigger
  state: AutomationExecutionState
  error: unknown | null
  executedAt: Date
  eventId: string
  payload: unknown
}

export class AutomationRepository extends RepositoryBase<AutomationRepository> {
  private insertExecutionColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.insertExecutionColumnSet = new this.dbInstance.helpers.ColumnSet(
      [
        'automationId',
        'type',
        'tenantId',
        'trigger',
        'state',
        'error',
        'executedAt',
        'eventId',
        'payload',
      ],
      {
        table: {
          table: 'automationExecutions',
        },
      },
    )
  }

  async get(automationId: string): Promise<IRelevantAutomationData | null> {
    const result = await this.db().oneOrNone(
      `
      select a.id, 
             a.type, 
             a.trigger, 
             a.settings,
             t."slackWebHook"
      from automations a 
        inner join tenants t on t.id = a."tenantId"
      where a.id = $(automationId)
      `,
      {
        automationId,
      },
    )

    return result
  }

  async findRelevant(
    tenantId: string,
    trigger: AutomationTrigger,
    state: AutomationState,
  ): Promise<IRelevantAutomationData[]> {
    const results = await this.db().any(
      `
    select id, type, trigger, settings
    from automations
    where "tenantId" = $(tenantId) and trigger = $(trigger) and state = $(state)
    `,
      {
        tenantId,
        trigger,
        state,
      },
    )

    return results
  }

  async hasAlreadyBeenTriggered(automationId: string, eventId: string): Promise<boolean> {
    const query = `
        select id
        from "automationExecutions"
        where "automationId" = $(automationId)
          and "eventId" = $(eventId)
          and state = '${AutomationExecutionState.SUCCESS}';
    `

    const results = await this.db().any(query, {
      automationId,
      eventId,
    })

    return results.length > 0
  }

  async createExecution(data: IDbAutomationExecutionInsertData): Promise<void> {
    const prepared = RepositoryBase.prepare(data, this.insertExecutionColumnSet)
    const query = this.dbInstance.helpers.insert(prepared, this.insertExecutionColumnSet)
    await this.db().none(query)
  }
}
