import { DbConnOrTx, DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { EntityType } from './types'

class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
    private readonly questdbSQL: DbConnOrTx,
  ) {}

  async hasActivitiesInQuestDb(id: string, type: EntityType): Promise<boolean> {
    const columnName = `${type}Id`
    const results = await this.questdbSQL.query(
      `select 1 from activities where "${columnName}" = $(id) limit 1`,
      {
        id,
      },
    )

    return results.length > 0
  }
}

export default ActivityRepository
