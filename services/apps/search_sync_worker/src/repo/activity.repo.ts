import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

export class ActivityRepository extends RepositoryBase<ActivityRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }
}
