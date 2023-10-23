import { Logger } from '@crowd/logging'
import { DbStore, RepositoryBase } from '@crowd/database'
import {
  AutomationExecutionState,
  AutomationSettings,
  AutomationState,
  AutomationTrigger,
  AutomationType,
} from '@crowd/types'

export interface IRelevantAutomationData {
  id: string
  type: AutomationType
  settings: AutomationSettings
  trigger: AutomationTrigger
}

export class AutomationRepository extends RepositoryBase<AutomationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  async get(automationId: string): Promise<IRelevantAutomationData | null> {
    const result = await this.db().oneOrNone(
      `
      select id, type, trigger, settings from automations where id = $(automationId)
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
}
