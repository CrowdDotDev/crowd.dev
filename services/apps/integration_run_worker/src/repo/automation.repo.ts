import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { AutomationSyncTrigger, IAutomationData } from '@crowd/types'

export class AutomationRepository extends RepositoryBase<AutomationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findSyncAutomations(
    tenantId: string,
    platform: string,
  ): Promise<IAutomationData[] | null> {
    const pageSize = 10
    const syncAutomations: IAutomationData[] = []

    let results
    let offset

    do {
      offset = results ? pageSize + offset : 0
      results = await this.db().any(
        `select * from automations 
         where type = $(platform) and "tenantId" = $(tenantId) and trigger in ($(syncAutomationTriggers:csv))
         limit $(limit) offset $(offset)`,
        {
          tenantId,
          platform,
          syncAutomationTriggers: [
            AutomationSyncTrigger.MEMBER_ATTRIBUTES_MATCH,
            AutomationSyncTrigger.ORGANIZATION_ATTRIBUTES_MATCH,
          ],
          limit: pageSize,
          offset,
        },
      )

      syncAutomations.push(...results)
    } while (results.length > 0)

    return syncAutomations
  }
}
