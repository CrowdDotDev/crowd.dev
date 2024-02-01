import { TenantPlans } from '@crowd/types'
import { Logger } from '@crowd/logging'
import { DbStore, RepositoryBase } from '@crowd/database'

export interface IPremiumTenantInfo {
  id: string
  plan: TenantPlans
}

export class TenantRepository extends RepositoryBase<TenantRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  async getPremiumTenants(perPage: number, lastId?: string): Promise<IPremiumTenantInfo[]> {
    return await this.db().any(
      `
      select  id,
              plan
      from tenants
      where plan in ($(plans:csv)) ${lastId ? 'and id > $(lastId)' : ''}
      order by id
      limit ${perPage};
      `,
      {
        plans: [TenantPlans.Enterprise, TenantPlans.Growth, TenantPlans.Scale],
        lastId,
      },
    )
  }
}
