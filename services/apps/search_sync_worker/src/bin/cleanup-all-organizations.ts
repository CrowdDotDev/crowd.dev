import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { InitService, OpenSearchService, OrganizationSyncService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG } from '../conf'

const log = getServiceLogger()

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const service = new OrganizationSyncService(store, openSearchService, log)

  const pageSize = 100
  let results = await service.getAllIndexedTenantIds(pageSize)

  while (results.data.length > 0) {
    for (const id of results.data) {
      if (id !== InitService.FAKE_TENANT_ID) {
        await service.cleanupOrganizationIndex(id)
      }
    }
    if (results.afterKey) {
      results = await service.getAllIndexedTenantIds(pageSize, results.afterKey)
    } else {
      results = { data: [] }
    }
  }

  process.exit(0)
})
