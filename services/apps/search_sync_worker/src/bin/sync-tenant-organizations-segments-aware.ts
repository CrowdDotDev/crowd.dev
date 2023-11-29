import { DB_CONFIG } from '../conf'
import { OpenSearchService } from '../service/opensearch.service'
import { OrganizationSyncService } from '../service/organization.sync.service'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: tenantId')
  process.exit(1)
}

const tenantId = processArguments[0]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const service = new OrganizationSyncService(store, openSearchService, log)

  await service.syncTenantOrganizationsV2(tenantId)

  process.exit(0)
})
