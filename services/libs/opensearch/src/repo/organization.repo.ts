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

  public async getAllOrganizationsForSync(
    perPage: number,
    previousBatchIds: string[],
  ): Promise<string[]> {
    const notInClause =
      previousBatchIds.length > 0 ? `o.id NOT IN ($(previousBatchIds:csv)) and` : ''
    const results = await this.db().any(
      `
      select o.id
      from organizations o
      left join indexed_entities ie on o.id = ie.entity_id and ie.type = $(type)
      where o."deletedAt" is null and
            ${notInClause}
            ie.entity_id is null
      limit ${perPage}`,
      {
        type: IndexedEntityType.ORGANIZATION,
        previousBatchIds,
      },
    )

    return results.map((r) => r.id)
  }

  public async getTenantIds(): Promise<string[]> {
    const results = await this.db().any(`select distinct "tenantId" from organizations;`)

    return results.map((r) => r.tenantId)
  }
}
