import { DB_CONFIG } from '@/conf'
import { ActivityRepository } from '@/repo/activity.repo'
import { ActivitySyncService } from '@/service/activity.sync.service'
import { OpenSearchService } from '@/service/opensearch.service'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)
  await openSearchService.initialize()

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new ActivityRepository(store, log)

  const tenantIds = await repo.getUnsyncedTenantIds()

  const service = new ActivitySyncService(store, openSearchService, log)

  for (const tenantId of tenantIds) {
    await service.syncTenantActivities(tenantId, false, 500)
  }
})
