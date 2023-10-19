import { Logger } from '@crowd/logging'
import { DbStore, RepositoryBase } from '@crowd/database'

export class MemberRepository extends RepositoryBase<MemberRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }
}
