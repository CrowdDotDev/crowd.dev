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
import { generateUUIDv1 } from '@crowd/common'

export interface IRelevantAutomationData {
  id: string
  tenantId: string
  type: AutomationType
  settings: AutomationSettings
  trigger: AutomationTrigger
  slackWebHook: string | null
  createdAt: string
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
        'id',
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
             a."tenantId",
             a.type, 
             a.trigger, 
             a.settings,
             s."slackWebHook"
      from automations a 
        inner join settings s on s."tenantId" = a."tenantId"
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
      select a.id, 
             a."tenantId",
             a.type, 
             a.trigger, 
             a.settings,
             s."slackWebHook",
             a."createdAt"
      from automations a 
        inner join settings s on s."tenantId" = a."tenantId"
      where a."tenantId" = $(tenantId) and a.trigger = $(trigger) and a.state = $(state)
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
    const id = generateUUIDv1()
    const prepared = RepositoryBase.prepare({ id, ...data }, this.insertExecutionColumnSet)
    const query = this.dbInstance.helpers.insert(prepared, this.insertExecutionColumnSet)
    await this.db().none(query)
  }
}
