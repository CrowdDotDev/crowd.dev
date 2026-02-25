import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

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
}
