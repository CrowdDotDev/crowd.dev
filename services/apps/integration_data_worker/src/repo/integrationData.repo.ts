import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

export default class IntegrationDataRepository extends RepositoryBase<IntegrationDataRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }
}
