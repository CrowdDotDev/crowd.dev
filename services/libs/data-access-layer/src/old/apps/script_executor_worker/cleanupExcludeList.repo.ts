// services/libs/data-access-layer/src/old/apps/script_executor_worker/cleanup-exclude-list.repo.ts
import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { EntityType } from './types'

class CleanupExcludeListRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async addToExcludeList(entityId: string, type: EntityType): Promise<void> {
    await this.connection.none(
      `
      insert into "cleanupExcludeList" (entityid, type)
      values ($(entityId), $(type))
      on conflict (entityid, type) do nothing
    `,
      { entityId, type },
    )
  }

  async purgeCleanupExcludeList(type: EntityType): Promise<void> {
    await this.connection.none(
      `
      delete from "cleanupExcludeList" where type = $(type)
    `,
      { type },
    )
  }
}

export default CleanupExcludeListRepository
