import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbIntegration } from './integration.data'
import { IAutomation } from '@crowd/types'

export class AutomationRepository extends RepositoryBase<AutomationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findById(id: string): Promise< IAutomation | null> {
    return await this.db().oneOrNone(`select * from automations where id = $(id)`, { id })
  }

}
