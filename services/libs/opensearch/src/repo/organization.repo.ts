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
    segmentId?: string,
  ): Promise<string[]> {
    const notInClause =
      previousBatchIds?.length > 0 ? `AND o.id NOT IN ($(previousBatchIds:csv))` : ''

    const segmentCondition = segmentId
      ? 'INNER JOIN organization_segments_mv osm ON osm."organizationId" = o.id AND osm."segmentId" = $(segmentId)'
      : ''

    const results = await this.db().any(
      `
      SELECT o.id
      FROM organizations o
      ${segmentCondition}
      LEFT JOIN indexed_entities ie ON ie.entity_id = o.id AND ie.type = $(type)
      WHERE o."deletedAt" is null
        AND ie.id IS NULL
        ${notInClause}
      ORDER BY o.id
      LIMIT $(perPage)`,
      {
        type: IndexedEntityType.ORGANIZATION,
        previousBatchIds,
        segmentId,
        perPage,
      },
    )

    return results.map((r) => r.id)
  }
}
