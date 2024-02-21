import { ActivitySyncService, OpenSearchService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG } from '../conf'
import { ActivityRepository } from '../repo/activity.repo'
import { generateUUIDv1, timeout } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

const MAX_CONCURRENT = 3

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new ActivityRepository(store, log)

  const tenantIds = await repo.getTenantIds()

  const service = new ActivitySyncService(store, openSearchService, log)

  const attemptId = generateUUIDv1()

  log.info({ attemptId }, 'Starting indexing attempt!')

  let current = 0
  for (let i = 0; i < tenantIds.length; i++) {
    const tenantId = tenantIds[i]

    while (current == MAX_CONCURRENT) {
      await timeout(1000)
    }

    log.info({ attemptId }, `Processing tenant ${i + 1}/${tenantIds.length}`)
    current += 1
    service
      .syncTenantActivities(tenantId, attemptId, 500)
      .then(() => {
        current--
        log.info({ attemptId }, `Processed tenant ${i + 1}/${tenantIds.length}`)
      })
      .catch((err) => {
        current--
        log.error(
          err,
          { attemptId, tenantId },
          `Error syncing activities for tenant ${i + 1}/${tenantIds.length}!`,
        )
      })
  }

  while (current > 0) {
    await timeout(1000)
  }

  process.exit(0)
})
