import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbOrganizationId } from './organization.data'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async checkOrganizationsExists(ids: string[]): Promise<IDbOrganizationId[]> {
    const results = await this.db().any(
      `
        select id
        from organizations o
        where o.id in ($(ids:csv))
        and o."deletedAt" is null;
      `,
      {
        ids,
      },
    )

    return results
  }

  public async getTenantIds(): Promise<string[]> {
    const results = await this.db().any(`select distinct "tenantId" from organizations;`)

    return results.map((r) => r.tenantId)
  }
}
