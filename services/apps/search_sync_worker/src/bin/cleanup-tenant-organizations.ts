import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { OpenSearchService, OrganizationSyncService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: tenantId')
  process.exit(1)
}

const tenantId = processArguments[0]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const service = new OrganizationSyncService(store, openSearchService, log)

  await service.cleanupOrganizationIndex(tenantId)

  process.exit(0)
})
