import { Logger } from '@crowd/logging'
import { DbStore, RepositoryBase } from '@crowd/database'
import { AutomationState, AutomationTrigger, IAutomationData } from '@crowd/types'

export class AutomationRepository extends RepositoryBase<AutomationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  async findRelevant(trigger: AutomationTrigger, state: AutomationState): Promise<IAutomationData>
}
