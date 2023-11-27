import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IPriorityPriorityCalculationContext } from '@crowd/types'

export class PriorityLevelContextRepository extends RepositoryBase<PriorityLevelContextRepository> {
  public constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async loadPriorityLevelContext(
    tenantId: string,
  ): Promise<IPriorityPriorityCalculationContext> {
    const result = await this.db().oneOrNone(
      `select plan, "priorityLevel" as "dbPriority" from tenants where id = $(tenantId)`,
      {
        tenantId,
      },
    )

    if (result) {
      return result
    }

    throw new Error(`Tenant not found: ${tenantId}!`)
  }
}
