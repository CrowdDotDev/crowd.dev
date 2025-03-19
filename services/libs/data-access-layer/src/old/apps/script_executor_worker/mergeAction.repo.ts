import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMergeAction } from '@crowd/types'

import { IFindMemberMergeActionReplacement } from './types'

class MergeActionRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async findMemberMergeActions(
    memberId: string,
    startDate?: string,
    endDate?: string,
    userId?: string,
    limit?: number,
  ) {
    let rows: IMergeAction[] = []
    let query = `
        select * from "mergeActions" ma
        where 
          ma."state" = 'merged' and 
          ma."primaryId" = $(memberId) and 
          ma."unmergeBackup" is not null `

    const replacements: IFindMemberMergeActionReplacement = {
      memberId,
    }

    if (startDate) {
      query += ' and ma."createdAt" > $(startDate)'
      replacements.startDate = startDate
    }

    if (endDate) {
      query += ' and ma."createdAt" < $(endDate)'
      replacements.endDate = endDate
    }

    if (userId) {
      query += ' and ma."actionBy" = $(userId)'
      replacements.userId = userId
    }

    query += ' order by ma."createdAt" desc'

    if (limit) {
      query += ' limit $(limit)'
      replacements.limit = limit
    }

    try {
      rows = await this.connection.query(query, replacements)
    } catch (err) {
      this.log.error('Error while finding merge actions!', err)

      throw new Error(err)
    }

    return rows
  }

  async findMergeActionsWithDeletedSecondaryEntities(
    limit: number,
    offset: number,
    entityType: 'member' | 'org',
  ): Promise<IMergeAction[]> {
    const tableMap = {
      member: 'members',
      org: 'organizations',
    }

    const tableName = tableMap[entityType]

    return this.connection.query(
      `
      select * from "mergeActions" ma
      where ma."state" = 'merged' and ma."type" = $(entityType)
      and not exists (
        select 1 from "${tableName}" e where e.id = ma."secondaryId" and e."deletedAt" is null
      )
      limit $(limit) offset $(offset)
      `,
      {
        limit,
        offset,
        entityType,
      },
    )
  }
}

export default MergeActionRepository
