import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IAutomationExecution } from '@crowd/types'
import { generateUUIDv1 as uuid } from '@crowd/common'

export class AutomationExecutionRepository extends RepositoryBase<AutomationExecutionRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async addExecution(data: IAutomationExecution): Promise<void> {
    await this.db().none(
      `insert into "automationExecutions" ("id", "automationId", "type", "tenantId", "trigger", "state", "error", "executedAt", "eventId", "payload")
        values
            ($(id), $(automationId), $(type), $(tenantId), $(trigger), $(state), $(error), now(), $(eventId), $(payload))`,
      {
        id: uuid(),
        automationId: data.automationId,
        type: data.type,
        tenantId: data.tenantId,
        trigger: data.trigger,
        state: data.state,
        error: data.error || null,
        eventId: data.eventId || uuid(),
        payload: JSON.stringify(data.payload) || JSON.stringify({}),
      },
    )
  }
}
