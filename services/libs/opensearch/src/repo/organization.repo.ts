import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IndexedEntityType } from './indexing.data'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async checkOrganizationsExists(orgIds: string[]): Promise<string[]> {
    const results = await this.db().any(
      `
      select id
      from
        organizations
      where
        id in ($(orgIds:csv)) and
        "deletedAt" is null
      `,
      {
        orgIds,
      },
    )

    return results.map((r) => r.id)
  }

  public async getOrganizationsForSync(
    perPage: number,
    previousBatchIds?: string[],
  ): Promise<string[]> {
    const notInClause =
      previousBatchIds?.length > 0 ? `AND o.id NOT IN ($(previousBatchIds:csv))` : ''
    const results = await this.db().any(
      `
      SELECT o.id
      FROM organizations o
      WHERE o."deletedAt" is null
      ${notInClause}
      AND NOT EXISTS (
        SELECT 1
        FROM indexed_entities ie 
        WHERE ie.entity_id = o.id
          AND ie.type = $(type)
      )
      ORDER BY o.id
      LIMIT ${perPage}`,
      {
        type: IndexedEntityType.ORGANIZATION,
        previousBatchIds,
      },
    )

    return results.map((r) => r.id)
  }
}
