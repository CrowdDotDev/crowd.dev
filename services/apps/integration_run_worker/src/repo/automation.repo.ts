import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { AutomationSyncTrigger, IAutomation } from '@crowd/types'

export class AutomationRepository extends RepositoryBase<AutomationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findSyncAutomations(
    tenantId: string,
    platform: string,
  ): Promise<IAutomation[] | null> {
    const results = await this.db().any(
      `select * from automations where type = $(platform) and "tenantId" = $(tenantId) and trigger in ($(syncAutomationTriggers:csv))`,
      {
        tenantId,
        platform,
        syncAutomationTriggers: [
          AutomationSyncTrigger.MEMBER_ATTRIBUTES_MATCH,
          AutomationSyncTrigger.ORGANIZATION_ATTRIBUTES_MATCH,
        ],
      },
    )

    return results
  }
}
