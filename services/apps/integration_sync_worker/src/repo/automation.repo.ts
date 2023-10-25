import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IAutomationData } from '@crowd/types'

export class AutomationRepository extends RepositoryBase<AutomationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findById(id: string): Promise<IAutomationData | null> {
    return await this.db().oneOrNone(`select * from automations where id = $(id)`, { id })
  }
}
